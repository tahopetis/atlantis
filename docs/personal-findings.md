I've done manual test:

http://localhost:3000/
Create New Diagram button - works
all other buttons not working

http://localhost:3000/editor
the code editor and the diagram preview is separated, there's a blank in the middle. weirdly, the left separator of the diagram preview can be dragged
the diagram preview shows Syntax Error - Error: Could not find a suitable point for the given distance and Rendering Failed Please check your Mermaid syntax and try again (Try Again button), when clicked Diagram Renderer Error - The diagram renderer encountered an error

Mermaid rendering error: Error: Could not find a suitable point for the given distance
    at bp (index-B9A8Jtqs.js:297:1573)
    at uM (index-B9A8Jtqs.js:297:1237)
    at Object.dM [as calcLabelPosition] (index-B9A8Jtqs.js:297:1285)
    at gr (edges-332bd1c7-CDuScSPZ.js:1:30703)
    at index-6079d271-Cfx9kqN4.js:1:11653
    at Array.forEach (<anonymous>)
    at M (index-6079d271-Cfx9kqN4.js:1:11504)
    at async bt (index-6079d271-Cfx9kqN4.js:1:11942)
    at async Object.ae [as draw] (styles-2ab5d517-B5CEDh5q.js:2:1280)
    at async Object.r$ [as render] (index-B9A8Jtqs.js:372:1372)
overrideMethod @ installHook.js:1
(anonymous) @ index-B9A8Jtqs.js:374
await in (anonymous)
(anonymous) @ index-B9A8Jtqs.js:374
setTimeout
(anonymous) @ index-B9A8Jtqs.js:374
(anonymous) @ index-B9A8Jtqs.js:374
Wc @ index-B9A8Jtqs.js:41
to @ index-B9A8Jtqs.js:41
jS @ index-B9A8Jtqs.js:41
Jn @ index-B9A8Jtqs.js:41
Jm @ index-B9A8Jtqs.js:41
qn @ index-B9A8Jtqs.js:39
(anonymous) @ index-B9A8Jtqs.js:41
installHook.js:1 Mermaid rendering error: Error: Parse error on line 5:
...   A[Start]    B[
--------------------^
Expecting 'SQE', 'DOUBLECIRCLEEND', 'PE', '-)', 'STADIUMEND', 'SUBROUTINEEND', 'PIPE', 'CYLINDEREND', 'DIAMOND_STOP', 'TAGEND', 'TRAPEND', 'INVTRAPEND', 'UNICODE_TEXT', 'TEXT', 'TAGSTART', got '1'
    at ct.parseError (flowDb-7c981674-BUXtVXyF.js:1:20055)
    at ct.parse (flowDb-7c981674-BUXtVXyF.js:3:173)
    at nC.parse (index-B9A8Jtqs.js:349:510)
    at new nC (index-B9A8Jtqs.js:349:245)
    at O6 (index-B9A8Jtqs.js:349:816)
    at $p (index-B9A8Jtqs.js:372:2463)
    at Object.r$ [as render] (index-B9A8Jtqs.js:372:1108)
    at index-B9A8Jtqs.js:374:524
    at new Promise (<anonymous>)
    at o (index-B9A8Jtqs.js:374:501)
overrideMethod @ installHook.js:1
(anonymous) @ index-B9A8Jtqs.js:374
await in (anonymous)
(anonymous) @ index-B9A8Jtqs.js:374
setTimeout
(anonymous) @ index-B9A8Jtqs.js:374
(anonymous) @ index-B9A8Jtqs.js:374
Wc @ index-B9A8Jtqs.js:41
to @ index-B9A8Jtqs.js:41
jS @ index-B9A8Jtqs.js:41
Jn @ index-B9A8Jtqs.js:41
Jm @ index-B9A8Jtqs.js:41
qn @ index-B9A8Jtqs.js:39
xi @ index-B9A8Jtqs.js:41
Wy @ index-B9A8Jtqs.js:38
ju @ index-B9A8Jtqs.js:38
yf @ index-B9A8Jtqs.js:38
kb @ index-B9A8Jtqs.js:38
installHook.js:1 Mermaid rendering error: Error: Parse error on line 5:
...A[Start]    B[end
--------------------^
Expecting 'SQE', 'DOUBLECIRCLEEND', 'PE', '-)', 'STADIUMEND', 'SUBROUTINEEND', 'PIPE', 'CYLINDEREND', 'DIAMOND_STOP', 'TAGEND', 'TRAPEND', 'INVTRAPEND', 'UNICODE_TEXT', 'TEXT', 'TAGSTART', got '1'
    at ct.parseError (flowDb-7c981674-BUXtVXyF.js:1:20055)
    at ct.parse (flowDb-7c981674-BUXtVXyF.js:3:173)
    at nC.parse (index-B9A8Jtqs.js:349:510)
    at new nC (index-B9A8Jtqs.js:349:245)
    at O6 (index-B9A8Jtqs.js:349:816)
    at $p (index-B9A8Jtqs.js:372:2463)
    at Object.r$ [as render] (index-B9A8Jtqs.js:372:1108)
    at index-B9A8Jtqs.js:374:524
    at new Promise (<anonymous>)
    at o (index-B9A8Jtqs.js:374:501)
overrideMethod @ installHook.js:1
(anonymous) @ index-B9A8Jtqs.js:374
await in (anonymous)
(anonymous) @ index-B9A8Jtqs.js:374
setTimeout
(anonymous) @ index-B9A8Jtqs.js:374
(anonymous) @ index-B9A8Jtqs.js:374
Wc @ index-B9A8Jtqs.js:41
to @ index-B9A8Jtqs.js:41
jS @ index-B9A8Jtqs.js:41
Jn @ index-B9A8Jtqs.js:41
Jm @ index-B9A8Jtqs.js:41
qn @ index-B9A8Jtqs.js:39
xi @ index-B9A8Jtqs.js:41
Wy @ index-B9A8Jtqs.js:38
ju @ index-B9A8Jtqs.js:38
yf @ index-B9A8Jtqs.js:38
kb @ index-B9A8Jtqs.js:38
installHook.js:1 Mermaid rendering error: Error: Could not find a suitable point for the given distance
    at bp (index-B9A8Jtqs.js:297:1573)
    at uM (index-B9A8Jtqs.js:297:1237)
    at Object.dM [as calcLabelPosition] (index-B9A8Jtqs.js:297:1285)
    at gr (edges-332bd1c7-CDuScSPZ.js:1:30703)
    at index-6079d271-Cfx9kqN4.js:1:11653
    at Array.forEach (<anonymous>)
    at M (index-6079d271-Cfx9kqN4.js:1:11504)
    at async bt (index-6079d271-Cfx9kqN4.js:1:11942)
    at async Object.ae [as draw] (styles-2ab5d517-B5CEDh5q.js:2:1280)
    at async Object.r$ [as render] (index-B9A8Jtqs.js:372:1372)
overrideMethod @ installHook.js:1
(anonymous) @ index-B9A8Jtqs.js:374
await in (anonymous)
(anonymous) @ index-B9A8Jtqs.js:374
setTimeout
(anonymous) @ index-B9A8Jtqs.js:374
(anonymous) @ index-B9A8Jtqs.js:374
Wc @ index-B9A8Jtqs.js:41
to @ index-B9A8Jtqs.js:41
jS @ index-B9A8Jtqs.js:41
Jn @ index-B9A8Jtqs.js:41
Jm @ index-B9A8Jtqs.js:41
qn @ index-B9A8Jtqs.js:39
xi @ index-B9A8Jtqs.js:41
Wy @ index-B9A8Jtqs.js:38
ju @ index-B9A8Jtqs.js:38
yf @ index-B9A8Jtqs.js:38
kb @ index-B9A8Jtqs.js:38
installHook.js:1 NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at c1 (index-B9A8Jtqs.js:41:26080)
    at ur (index-B9A8Jtqs.js:41:27370)
    at u1 (index-B9A8Jtqs.js:41:27830)
    at ur (index-B9A8Jtqs.js:41:27520)
    at u1 (index-B9A8Jtqs.js:41:27830)
    at ur (index-B9A8Jtqs.js:41:27520)
    at u1 (index-B9A8Jtqs.js:41:27830)
    at ur (index-B9A8Jtqs.js:41:27520)
    at u1 (index-B9A8Jtqs.js:41:27633)
    at ur (index-B9A8Jtqs.js:41:27520)
overrideMethod @ installHook.js:1
oh @ index-B9A8Jtqs.js:41
Zx.o.componentDidCatch.r.callback @ index-B9A8Jtqs.js:41
Im @ index-B9A8Jtqs.js:39
Km @ index-B9A8Jtqs.js:41
d1 @ index-B9A8Jtqs.js:41
$S @ index-B9A8Jtqs.js:41
jS @ index-B9A8Jtqs.js:41
Jn @ index-B9A8Jtqs.js:41
Jm @ index-B9A8Jtqs.js:41
qn @ index-B9A8Jtqs.js:39
(anonymous) @ index-B9A8Jtqs.js:41
installHook.js:1 Mermaid Editor Error Boundary caught an error: NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at c1 (index-B9A8Jtqs.js:41:26080)
    at ur (index-B9A8Jtqs.js:41:27370)
    at u1 (index-B9A8Jtqs.js:41:27830)
    at ur (index-B9A8Jtqs.js:41:27520)
    at u1 (index-B9A8Jtqs.js:41:27830)
    at ur (index-B9A8Jtqs.js:41:27520)
    at u1 (index-B9A8Jtqs.js:41:27830)
    at ur (index-B9A8Jtqs.js:41:27520)
    at u1 (index-B9A8Jtqs.js:41:27633)
    at ur (index-B9A8Jtqs.js:41:27520) {componentStack: '\n    at div\n    at div\n    at div\n    at div\n    a…//localhost:3000/assets/index-B9A8Jtqs.js:68:738)'}
overrideMethod @ installHook.js:1
componentDidCatch @ index-B9A8Jtqs.js:378
Zx.o.componentDidCatch.r.callback @ index-B9A8Jtqs.js:41
Im @ index-B9A8Jtqs.js:39
Km @ index-B9A8Jtqs.js:41
d1 @ index-B9A8Jtqs.js:41
$S @ index-B9A8Jtqs.js:41
jS @ index-B9A8Jtqs.js:41
Jn @ index-B9A8Jtqs.js:41
Jm @ index-B9A8Jtqs.js:41
qn @ index-B9A8Jtqs.js:39
(anonymous) @ index-B9A8Jtqs.js:41
installHook.js:1 Mermaid rendering error: Error: Could not find a suitable point for the given distance
    at bp (index-B9A8Jtqs.js:297:1573)
    at uM (index-B9A8Jtqs.js:297:1237)
    at Object.dM [as calcLabelPosition] (index-B9A8Jtqs.js:297:1285)
    at gr (edges-332bd1c7-CDuScSPZ.js:1:30703)
    at index-6079d271-Cfx9kqN4.js:1:11653
    at Array.forEach (<anonymous>)
    at M (index-6079d271-Cfx9kqN4.js:1:11504)
    at async bt (index-6079d271-Cfx9kqN4.js:1:11942)
    at async Object.ae [as draw] (styles-2ab5d517-B5CEDh5q.js:2:1280)
    at async Object.r$ [as render] (index-B9A8Jtqs.js:372:1372)
overrideMethod @ installHook.js:1
(anonymous) @ index-B9A8Jtqs.js:374
await in (anonymous)
(anonymous) @ index-B9A8Jtqs.js:374
(anonymous) @ index-B9A8Jtqs.js:375
sb @ index-B9A8Jtqs.js:38
lb @ index-B9A8Jtqs.js:38
cb @ index-B9A8Jtqs.js:38
bm @ index-B9A8Jtqs.js:38
xx @ index-B9A8Jtqs.js:38
(anonymous) @ index-B9A8Jtqs.js:38
Hf @ index-B9A8Jtqs.js:41
Wy @ index-B9A8Jtqs.js:38
ju @ index-B9A8Jtqs.js:38
yf @ index-B9A8Jtqs.js:38
kb @ index-B9A8Jtqs.js:38

the top buttons, again, cannot be clicked, the left pane buttons too

this is the error shows in the console when i clicked the examples

installHook.js:1 Mermaid rendering error: Error: Could not find a suitable point for the given distance
    at bp (index-DooRPiQu.js:297:1573)
    at uM (index-DooRPiQu.js:297:1237)
    at Object.dM [as calcLabelPosition] (index-DooRPiQu.js:297:1285)
    at gr (edges-332bd1c7-kdR__Pkc.js:1:30703)
    at index-6079d271-EkjhrSu2.js:1:11653
    at Array.forEach (<anonymous>)
    at M (index-6079d271-EkjhrSu2.js:1:11504)
    at async bt (index-6079d271-EkjhrSu2.js:1:11942)
    at async Object.ae [as draw] (styles-2ab5d517-BuP2ZJDS.js:2:1280)
    at async Object.r$ [as render] (index-DooRPiQu.js:372:1372)
overrideMethod @ installHook.js:1
(anonymous) @ index-DooRPiQu.js:374
await in (anonymous)
(anonymous) @ index-DooRPiQu.js:374
setTimeout
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
Wc @ index-DooRPiQu.js:41
to @ index-DooRPiQu.js:41
(anonymous) @ index-DooRPiQu.js:41
E @ index-DooRPiQu.js:26
W @ index-DooRPiQu.js:26
8Error: <rect> attribute width: A negative value is not valid. ("-37.5")
index-DooRPiQu.js:290 Error: <rect> attribute width: A negative value is not valid. ("-90")
(anonymous) @ index-DooRPiQu.js:290
OE @ index-DooRPiQu.js:290
UE @ index-DooRPiQu.js:290
H @ ganttDiagram-04f9e578-3c-cOGxs.js:6
L @ ganttDiagram-04f9e578-3c-cOGxs.js:6
hs @ ganttDiagram-04f9e578-3c-cOGxs.js:6
r$ @ index-DooRPiQu.js:372
await in r$
(anonymous) @ index-DooRPiQu.js:374
o @ index-DooRPiQu.js:374
CC @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
wC @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
setTimeout
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
Wc @ index-DooRPiQu.js:41
to @ index-DooRPiQu.js:41
jS @ index-DooRPiQu.js:41
Jn @ index-DooRPiQu.js:41
Jm @ index-DooRPiQu.js:41
qn @ index-DooRPiQu.js:39
(anonymous) @ index-DooRPiQu.js:41
index-DooRPiQu.js:290 Error: <rect> attribute width: A negative value is not valid. ("-36")
(anonymous) @ index-DooRPiQu.js:290
OE @ index-DooRPiQu.js:290
UE @ index-DooRPiQu.js:290
H @ ganttDiagram-04f9e578-3c-cOGxs.js:6
L @ ganttDiagram-04f9e578-3c-cOGxs.js:6
hs @ ganttDiagram-04f9e578-3c-cOGxs.js:6
r$ @ index-DooRPiQu.js:372
await in r$
(anonymous) @ index-DooRPiQu.js:374
o @ index-DooRPiQu.js:374
CC @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
wC @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
setTimeout
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
Wc @ index-DooRPiQu.js:41
to @ index-DooRPiQu.js:41
jS @ index-DooRPiQu.js:41
Jn @ index-DooRPiQu.js:41
Jm @ index-DooRPiQu.js:41
qn @ index-DooRPiQu.js:39
(anonymous) @ index-DooRPiQu.js:41
index-DooRPiQu.js:290 Error: <rect> attribute width: A negative value is not valid. ("-72")
(anonymous) @ index-DooRPiQu.js:290
OE @ index-DooRPiQu.js:290
UE @ index-DooRPiQu.js:290
H @ ganttDiagram-04f9e578-3c-cOGxs.js:6
L @ ganttDiagram-04f9e578-3c-cOGxs.js:6
hs @ ganttDiagram-04f9e578-3c-cOGxs.js:6
r$ @ index-DooRPiQu.js:372
await in r$
(anonymous) @ index-DooRPiQu.js:374
o @ index-DooRPiQu.js:374
CC @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
wC @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
setTimeout
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
Wc @ index-DooRPiQu.js:41
to @ index-DooRPiQu.js:41
jS @ index-DooRPiQu.js:41
Jn @ index-DooRPiQu.js:41
Jm @ index-DooRPiQu.js:41
qn @ index-DooRPiQu.js:39
(anonymous) @ index-DooRPiQu.js:41
index-DooRPiQu.js:290 Error: <rect> attribute width: A negative value is not valid. ("-60")
(anonymous) @ index-DooRPiQu.js:290
OE @ index-DooRPiQu.js:290
UE @ index-DooRPiQu.js:290
H @ ganttDiagram-04f9e578-3c-cOGxs.js:6
L @ ganttDiagram-04f9e578-3c-cOGxs.js:6
hs @ ganttDiagram-04f9e578-3c-cOGxs.js:6
r$ @ index-DooRPiQu.js:372
await in r$
(anonymous) @ index-DooRPiQu.js:374
o @ index-DooRPiQu.js:374
CC @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
wC @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
setTimeout
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
Wc @ index-DooRPiQu.js:41
to @ index-DooRPiQu.js:41
jS @ index-DooRPiQu.js:41
Jn @ index-DooRPiQu.js:41
Jm @ index-DooRPiQu.js:41
qn @ index-DooRPiQu.js:39
(anonymous) @ index-DooRPiQu.js:41
index-DooRPiQu.js:374 Error: <rect> attribute width: A negative value is not valid. ("-90")
(anonymous) @ index-DooRPiQu.js:374
await in (anonymous)
(anonymous) @ index-DooRPiQu.js:374
setTimeout
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
Wc @ index-DooRPiQu.js:41
to @ index-DooRPiQu.js:41
jS @ index-DooRPiQu.js:41
Jn @ index-DooRPiQu.js:41
Jm @ index-DooRPiQu.js:41
qn @ index-DooRPiQu.js:39
(anonymous) @ index-DooRPiQu.js:41
index-DooRPiQu.js:374 Error: <rect> attribute width: A negative value is not valid. ("-36")
(anonymous) @ index-DooRPiQu.js:374
await in (anonymous)
(anonymous) @ index-DooRPiQu.js:374
setTimeout
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
Wc @ index-DooRPiQu.js:41
to @ index-DooRPiQu.js:41
jS @ index-DooRPiQu.js:41
Jn @ index-DooRPiQu.js:41
Jm @ index-DooRPiQu.js:41
qn @ index-DooRPiQu.js:39
(anonymous) @ index-DooRPiQu.js:41
index-DooRPiQu.js:374 Error: <rect> attribute width: A negative value is not valid. ("-72")
(anonymous) @ index-DooRPiQu.js:374
await in (anonymous)
(anonymous) @ index-DooRPiQu.js:374
setTimeout
(anonymous) @ index-DooRPiQu.js:374
(anonymous) @ index-DooRPiQu.js:374
Wc @ index-DooRPiQu.js:41
to @ index-DooRPiQu.js:41
jS @ index-DooRPiQu.js:41
Jn @ index-DooRPiQu.js:41
Jm @ index-DooRPiQu.js:41
qn @ index-DooRPiQu.js:39
(anonymous) @ index-DooRPiQu.js:41
index-DooRPiQu.js:374 Error: <rect> attribute width: A negative value is not valid. ("-60")

these button position are messed up too
Diagram Preview

Code

Visual


100%


Fit to Screen

Reset

