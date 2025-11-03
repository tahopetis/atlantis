import re
import json
import mimetypes
from typing import Optional, Tuple, Dict, Any, List
from pathlib import Path
import magic  # python-magic library for file type detection

from ..core.config import settings
from ..models.file import FileType


class FileValidator:
    """Utility class for validating files and content"""

    # Allowed file extensions and their corresponding types
    ALLOWED_EXTENSIONS = {
        '.mmd': FileType.MERMAID,
        '.mermaid': FileType.MERMAID,
        '.json': FileType.JSON,
        '.md': FileType.MARKDOWN,
        '.markdown': FileType.MARKDOWN,
        '.png': FileType.PNG,
        '.svg': FileType.SVG
    }

    # Maximum file sizes by type (in bytes)
    MAX_FILE_SIZES = {
        FileType.MERMAID: 100 * 1024,      # 100KB
        FileType.JSON: 1 * 1024 * 1024,   # 1MB
        FileType.MARKDOWN: 500 * 1024,    # 500KB
        FileType.PNG: 5 * 1024 * 1024,    # 5MB
        FileType.SVG: 1 * 1024 * 1024     # 1MB
    }

    # Mermaid diagram keywords for validation
    MERMAID_KEYWORDS = {
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram',
        'erDiagram', 'journey', 'gantt', 'pie', 'quadrantChart', 'requirementDiagram',
        'C4', 'gitgraph', 'mindmap', 'timeline', 'zenuml', 'sankey', 'block', 'architecture'
    }

    @classmethod
    def validate_filename(cls, filename: str) -> Tuple[bool, Optional[str]]:
        """
        Validate filename for security and format compliance

        Args:
            filename: The filename to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not filename:
            return False, "Filename cannot be empty"

        # Length check
        if len(filename) > 255:
            return False, "Filename too long (max 255 characters)"

        # Path traversal prevention
        if '..' in filename or '/' in filename or '\\' in filename:
            return False, "Invalid characters in filename (path traversal not allowed)"

        # Invalid characters
        invalid_chars = ['<', '>', ':', '"', '|', '?', '*', '\0']
        if any(char in filename for char in invalid_chars):
            return False, "Filename contains invalid characters"

        # Reserved names (Windows)
        reserved_names = {
            'CON', 'PRN', 'AUX', 'NUL',
            'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
            'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
        }
        name_without_ext = Path(filename).stem.upper()
        if name_without_ext in reserved_names:
            return False, f"Filename '{filename}' is a reserved name"

        # Extension check
        file_ext = Path(filename).suffix.lower()
        if file_ext not in cls.ALLOWED_EXTENSIONS:
            return False, f"File extension '{file_ext}' not allowed"

        return True, None

    @classmethod
    def sanitize_filename(cls, filename: str, file_type: Optional[str] = None) -> str:
        """
        Sanitize filename by removing or replacing invalid characters

        Args:
            filename: The filename to sanitize
            file_type: Optional file type to ensure correct extension

        Returns:
            Sanitized filename
        """
        if not filename:
            filename = "untitled"

        # Remove invalid characters
        sanitized = re.sub(r'[<>:"|?*\0]', '', filename)
        sanitized = sanitized.replace('/', '_').replace('\\', '_')

        # Remove or replace other problematic characters
        sanitized = re.sub(r'[\s\.]+', '_', sanitized.strip())

        # Ensure filename doesn't start with dot (hidden file)
        if sanitized.startswith('.'):
            sanitized = 'file' + sanitized

        # Ensure it has a valid extension
        file_ext = Path(sanitized).suffix.lower()
        if file_ext not in cls.ALLOWED_EXTENSIONS:
            if file_type:
                # Use provided file type
                ext = cls._get_extension_for_type(file_type)
                sanitized += ext
            else:
                # Default to .mmd
                sanitized += '.mmd'

        return sanitized or "untitled.mmd"

    @classmethod
    def validate_file_type(cls, filename: str, content: Optional[str] = None) -> Tuple[FileType, Optional[str]]:
        """
        Determine and validate file type from filename and optionally content

        Args:
            filename: The filename
            content: Optional file content for additional validation

        Returns:
            Tuple of (file_type, error_message)
        """
        file_ext = Path(filename).suffix.lower()

        if file_ext not in cls.ALLOWED_EXTENSIONS:
            return None, f"File extension '{file_ext}' not supported"

        file_type = cls.ALLOWED_EXTENSIONS[file_ext]

        # Additional content-based validation if content provided
        if content:
            is_valid, error = cls.validate_content_by_type(content, file_type)
            if not is_valid:
                return None, error

        return file_type, None

    @classmethod
    def validate_content_by_type(cls, content: str, file_type: FileType) -> Tuple[bool, Optional[str]]:
        """
        Validate content based on file type

        Args:
            content: The content to validate
            file_type: The file type

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not content or not content.strip():
            return False, "Content cannot be empty"

        content_size = len(content.encode('utf-8'))
        max_size = cls.MAX_FILE_SIZES.get(file_type, 1 * 1024 * 1024)  # Default 1MB

        if content_size > max_size:
            return False, f"Content too large for {file_type.value} files (max {max_size // 1024}KB)"

        # Type-specific validation
        if file_type == FileType.MERMAID:
            return cls._validate_mermaid_content(content)
        elif file_type == FileType.JSON:
            return cls._validate_json_content(content)
        elif file_type == FileType.MARKDOWN:
            return cls._validate_markdown_content(content)
        elif file_type == FileType.SVG:
            return cls._validate_svg_content(content)
        elif file_type == FileType.PNG:
            return cls._validate_png_content(content)

        return True, None

    @classmethod
    def _validate_mermaid_content(cls, content: str) -> Tuple[bool, Optional[str]]:
        """Validate Mermaid diagram content"""
        lines = content.strip().split('\n')

        # Check if content starts with a valid Mermaid keyword
        first_line = lines[0].strip().lower()
        if not any(keyword in first_line for keyword in cls.MERMAID_KEYWORDS):
            return False, "Invalid Mermaid diagram syntax - must start with a valid diagram type"

        # Basic syntax validation
        for line_num, line in enumerate(lines[1:], 2):
            line = line.strip()
            if not line or line.startswith('%%'):  # Skip empty lines and comments
                continue

            # Check for basic syntax errors
            if '-->' in line and line.count('-->') > 1:
                return False, f"Syntax error on line {line_num}: multiple arrow operators"

            # Check for balanced brackets
            if '[' in line or '(' in line or '{' in line:
                if not cls._are_brackets_balanced(line):
                    return False, f"Syntax error on line {line_num}: unbalanced brackets"

        return True, None

    @classmethod
    def _validate_json_content(cls, content: str) -> Tuple[bool, Optional[str]]:
        """Validate JSON content for diagram data"""
        try:
            data = json.loads(content)

            # Must be a dictionary/object
            if not isinstance(data, dict):
                return False, "JSON must be an object/dictionary"

            # Check for required fields (at least one of these should be present)
            required_fields = ['mermaid_code', 'diagram_data', 'nodes', 'edges']
            if not any(field in data for field in required_fields):
                return False, "JSON must contain diagram data (mermaid_code, diagram_data, nodes, or edges)"

            # Validate mermaid_code if present
            if 'mermaid_code' in data:
                is_valid, error = cls._validate_mermaid_content(data['mermaid_code'])
                if not is_valid:
                    return False, f"Invalid mermaid_code in JSON: {error}"

            # Validate diagram_data structure if present
            if 'diagram_data' in data:
                if not isinstance(data['diagram_data'], dict):
                    return False, "diagram_data must be an object"

            return True, None

        except json.JSONDecodeError as e:
            return False, f"Invalid JSON format: {str(e)}"

    @classmethod
    def _validate_markdown_content(cls, content: str) -> Tuple[bool, Optional[str]]:
        """Validate Markdown content with Mermaid code blocks"""
        # Check for at least one Mermaid code block
        mermaid_blocks = re.findall(r'```mermaid\n(.*?)\n```', content, re.DOTALL)

        if not mermaid_blocks:
            return False, "Markdown file must contain at least one Mermaid code block"

        # Validate each Mermaid block
        for i, mermaid_code in enumerate(mermaid_blocks):
            is_valid, error = cls._validate_mermaid_content(mermaid_code)
            if not is_valid:
                return False, f"Invalid Mermaid code in block {i + 1}: {error}"

        return True, None

    @classmethod
    def _validate_svg_content(cls, content: str) -> Tuple[bool, Optional[str]]:
        """Validate SVG content"""
        # Basic SVG validation
        if not content.strip().startswith('<svg') or not content.strip().endswith('</svg>'):
            return False, "Invalid SVG format - must start with <svg> and end with </svg>"

        # Check for SVG namespace
        if 'xmlns="http://www.w3.org/2000/svg"' not in content:
            return False, "SVG missing required xmlns attribute"

        # Basic security check - no scripts
        if '<script' in content.lower():
            return False, "SVG content cannot contain scripts"

        return True, None

    @classmethod
    def _validate_png_content(cls, content: str) -> Tuple[bool, Optional[str]]:
        """Validate PNG content"""
        # PNG files should be binary, but if we receive them as strings,
        # we can do basic validation on the base64 or encoded content
        try:
            # If it's base64 encoded
            import base64
            decoded = base64.b64decode(content)

            # Check PNG signature
            if not decoded.startswith(b'\x89PNG\r\n\x1a\n'):
                return False, "Invalid PNG file signature"

        except Exception:
            return False, "Invalid PNG content format"

        return True, None

    @classmethod
    def _are_brackets_balanced(cls, line: str) -> bool:
        """Check if brackets are balanced in a line"""
        stack = []
        bracket_pairs = {'(': ')', '[': ']', '{': '}'}
        closing_brackets = {')', ']', '}'}

        for char in line:
            if char in bracket_pairs:
                stack.append(char)
            elif char in closing_brackets:
                if not stack:
                    return False
                opening = stack.pop()
                if bracket_pairs[opening] != char:
                    return False

        return len(stack) == 0

    @classmethod
    def _get_extension_for_type(cls, file_type: str) -> str:
        """Get file extension for file type"""
        type_extensions = {
            'mmd': '.mmd',
            'json': '.json',
            'md': '.md',
            'png': '.png',
            'svg': '.svg'
        }
        return type_extensions.get(file_type.lower(), '.mmd')

    @classmethod
    def extract_mermaid_from_markdown(cls, content: str) -> List[str]:
        """Extract Mermaid code blocks from Markdown content"""
        return re.findall(r'```mermaid\n(.*?)\n```', content, re.DOTALL)

    @classmethod
    def extract_diagram_data_from_json(cls, content: str) -> Dict[str, Any]:
        """Extract and validate diagram data from JSON content"""
        try:
            data = json.loads(content)

            # Normalize diagram data structure
            diagram_data = {
                'mermaid_code': data.get('mermaid_code', ''),
                'nodes': data.get('nodes', data.get('diagram_data', {}).get('nodes', [])),
                'edges': data.get('edges', data.get('diagram_data', {}).get('edges', [])),
                'layout': data.get('layout', 'TB'),
                'theme': data.get('theme', 'default'),
                'metadata': data.get('metadata', {})
            }

            return diagram_data

        except json.JSONDecodeError:
            return {}

    @classmethod
    def generate_safe_filename(cls, base_name: str, file_type: FileType, user_id: int) -> str:
        """Generate a safe, unique filename"""
        import hashlib
        import time
        import secrets

        # Create user hash
        user_hash = hashlib.sha256(str(user_id).encode()).hexdigest()[:8]

        # Create timestamp and random suffix
        timestamp = int(time.time())
        random_suffix = secrets.token_hex(4)

        # Sanitize base name
        safe_name = cls.sanitize_filename(base_name, file_type.value)
        name_without_ext = Path(safe_name).stem

        # Generate final filename
        extension = cls._get_extension_for_type(file_type.value)
        filename = f"{name_without_ext}_{user_hash}_{timestamp}_{random_suffix}{extension}"

        return filename

    @classmethod
    def validate_file_content_security(cls, content: str) -> Tuple[bool, Optional[str]]:
        """
        Validate file content for security issues

        Args:
            content: File content to validate

        Returns:
            Tuple of (is_safe, error_message)
        """
        # Check for potentially dangerous content
        dangerous_patterns = [
            r'<script[^>]*>.*?</script>',  # Scripts
            r'javascript:',               # JavaScript URLs
            r'on\w+\s*=',                # Event handlers
            r'eval\s*\(',                # eval() function
            r'document\.',               # Document access
            r'window\.',                 # Window access
            r'@import',                  # CSS imports
            r'expression\s*\(',          # CSS expressions
        ]

        for pattern in dangerous_patterns:
            if re.search(pattern, content, re.IGNORECASE | re.DOTALL):
                return False, f"Content contains potentially dangerous code: {pattern}"

        # Check for file path inclusion attempts
        path_patterns = [
            r'\.\./.*',
            r'\.\.\\.*',
            r'/etc/',
            r'/proc/',
            r'C:\\Windows\\',
            r'/usr/bin/',
        ]

        for pattern in path_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                return False, "Content contains potentially dangerous file paths"

        # Check for excessive size (prevents DoS)
        if len(content) > 50 * 1024 * 1024:  # 50MB limit
            return False, "Content too large for security validation"

        return True, None