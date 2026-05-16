Link : https://project-xkcid.vercel.app/
# Mutual Exclusion Simulators

An interactive, visual simulation to help students understand concurrent programming algorithms for mutual exclusion in Operating Systems. This application covers both **Peterson's Solution** (2 processes) and **Bounded-Waiting Compare And Swap (CAS)** (3 processes). 

Built entirely with vanilla web technologies (HTML, CSS, JavaScript), it features a highly modern, fluid, and responsive user interface designed for maximum pedagogical clarity.

## 🚀 Features

- **Dual Algorithms**: Switch seamlessly between Peterson's Solution and a 3-process Bounded-Waiting CAS algorithm via top navigation tabs.
- **Interactive Execution**: Manually step through each process line-by-line to understand scheduling and race conditions.
- **Auto-Play Simulation**: Watch the algorithms execute dynamically with randomized process scheduling to test the mutual exclusion constraints in real-time.
- **Live Memory Visualization**: See real-time horizontal stack updates for shared memory variables (`flag`, `turn`, `waiting`, `key`, `lock`) with visual indicator arrows pointing to active memory writes/reads.
- **Persistent Visual Feedback (Code Highlighting)**: The simulator intelligently highlights variables inside the code in real-time:
  - 🟩 **Green Glow**: The condition is met, and the process is allowed to proceed (e.g., entering the Critical Section).
  - 🟥 **Red Glow**: The condition is unmet, causing the process to block (e.g., spinning in a `while` loop).
  - Highlights stay visible until the next step to allow students sufficient time to analyze the state.
- **Inline Value Tooltips**: Floating data tags (e.g., `=true`, `=0`) instantly pop up next to highlighted variables inside the code, allowing you to trace exact memory states without taking your eyes off the algorithm.
- **Fully Fluid Responsive UI**: Uses advanced CSS viewport clamping to scale proportionally. The entire interface flawlessly stretches and shrinks to fit anything from small laptop screens to ultra-wide monitors.

## 📁 Project Structure

- `index.html`: The structural markup, containing the layout and code views for both simulators.
- `style.css`: The styling, glassmorphism themes, fluid typography, and micro-animations driving the aesthetic layout.
- `script.js`: The state machine executing Peterson's algorithm logic.
- `cas-script.js`: The state machine executing the 3-process Bounded-Waiting CAS algorithm logic.

## 🧠 About the Algorithms

### Peterson's Solution (2 Processes)
A classic software-based solution that guarantees mutual exclusion, progress, and bounded waiting. It utilizes two shared variables (`flag` and `turn`). A process sets its `flag` to true to indicate desire, but graciously hands over the `turn` to the other process, spinning in a `while` loop until it is safe to proceed.

### Bounded-Waiting Compare And Swap (3 Processes)
A hardware-assisted synchronization approach utilizing atomic `CAS(&lock, expected, new)` instructions. While standard CAS guarantees mutual exclusion, it does not inherently guarantee bounded waiting (a process could starve). This specific algorithm introduces an array of `waiting` flags to enforce a strict queue-like system, ensuring that no process waits indefinitely while others continuously enter the critical section.
