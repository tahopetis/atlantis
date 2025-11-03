The key error in your traceback is this line:

```
sqlalchemy.exc.InvalidRequestError: Attribute name 'metadata' is reserved when using the Declarative API.
```

---

### 💡 Root Cause

In **SQLAlchemy ORM**, the attribute name `metadata` is **reserved** because it’s used internally by SQLAlchemy for schema metadata.
If one of your models (for example, `DiagramFile` in `/app/app/models/file.py`) defines a column or attribute named `metadata`, SQLAlchemy will throw this error.

---

### 🔍 Example of the Problem

You probably have something like this in your model:

```python
class DiagramFile(Base):
    __tablename__ = "diagram_files"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    metadata = Column(JSON)  # ❌ Problem here
```

---

### ✅ Fix

Rename the `metadata` attribute to something else, such as `meta`, `file_metadata`, or `details`:

```python
class DiagramFile(Base):
    __tablename__ = "diagram_files"

    id = Column(Integer, primary_key=True)
    name = Column(String)
    file_metadata = Column(JSON)  # ✅ Renamed field
```

Then update all references in your code where you used `.metadata`:

```python
file.file_metadata
```

---

### 🧹 After Fixing

1. Save your changes.
2. Rebuild or restart your app (if running in Docker):

   ```bash
   docker compose down
   docker compose up --build
   ```
3. Check that migrations or ORM mappings now load correctly.

---


