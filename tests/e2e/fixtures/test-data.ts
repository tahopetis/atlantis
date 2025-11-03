export const MERMAID_EXAMPLES = {
  flowchart: `graph TD
    A[Start] --> B[Process]
    B --> C[End]`,

  sequenceDiagram: `sequenceDiagram
    participant Alice
    participant Bob
    Alice->>John: Hello John, how are you?
    loop Healthcheck
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts <br/>prevail!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!`,

  classDiagram: `classDiagram
    class Animal {
        +String name
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,

  ganttChart: `gantt
    title A Gantt Diagram
    dateFormat  YYYY-MM-DD
    section Section
    A task           :a1, 2014-01-01, 30d
    Another task     :after a1  , 20d
    section Another
    Task in sec      :2014-01-12  , 12d
    another task      : 24d`,

  stateDiagram: `stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]`,

  pieChart: `pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15`,

  journeyDiagram: `journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me`
}

export const INVALID_MERMAID_EXAMPLES = {
  syntaxError: 'graph TD\n    A[Start] -> B[End]  // Missing arrow syntax',
  undefinedNode: 'graph TD\n    A[Start] --> B\n    B --> C[End]',
  mismatchedBrackets: 'graph TD\n    A[Start] --> B{Decision\n    B -->|Yes| C[End]',
  invalidDirection: 'graph INVALID\n    A[Start] --> B[End]',
  emptyDiagram: '',
  incompleteDiagram: 'graph TD\n    A[Start]'
}

export const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  laptop: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobileLarge: { width: 414, height: 896 },
  mobile: { width: 375, height: 667 },
  mobileSmall: { width: 320, height: 568 }
}

export const NODE_TYPES = {
  rectangle: 'Rectangle Node',
  circle: 'Circle Node',
  diamond: 'Diamond Node',
  parallelogram: 'Parallelogram Node'
}

export const TEST_DIAGRAMS = {
  simple: 'graph TD\n    A[Start] --> B[End]',
  complex: `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`,
  loop: `graph TD
    A[Start] --> B[Process]
    B --> C{Continue?}
    C -->|Yes| B
    C -->|No| D[End]`,
  multiplePaths: `graph TD
    A[Start] --> B[Step 1]
    B --> C[Step 2]
    B --> D[Alternative]
    C --> E[End]
    D --> E`
}

export const PERFORMANCE_METRICS = {
  maxRenderTime: 5000, // ms
  maxValidationTime: 2000, // ms
  maxModeSwitchTime: 1000, // ms
  maxNodeCreationTime: 500, // ms
  maxZoomAnimationTime: 300 // ms
}

export const ACCESSIBILITY_SELECTORS = {
  skipLinks: '[href*="skip"], [aria-label*="skip"]',
  landmarks: 'main, nav, header, footer, section, aside',
  headings: 'h1, h2, h3, h4, h5, h6',
  buttons: 'button, [role="button"]',
  links: 'a[href]',
  inputs: 'input, textarea, select',
  images: 'img',
  focusableElements: 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
}

export const ERROR_MESSAGES = {
  networkError: 'Network error occurred',
  renderError: 'Failed to render diagram',
  validationError: 'Syntax error in diagram',
  saveError: 'Failed to save diagram',
  loadError: 'Failed to load diagram'
}

export const FILE_FORMATS = {
  mermaid: '.mmd',
  svg: '.svg',
  png: '.png',
  json: '.json'
}

export const ANIMATION_TIMING = {
  short: 100,
  medium: 300,
  long: 1000,
  extraLong: 3000
}

export const COORDINATES = {
  center: { x: 400, y: 300 },
  topLeft: { x: 100, y: 100 },
  topRight: { x: 700, y: 100 },
  bottomLeft: { x: 100, y: 500 },
  bottomRight: { x: 700, y: 500 }
}