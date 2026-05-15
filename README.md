# Peterson's Solution Simulator

An interactive, visual simulation to help students understand **Peterson's Solution** for mutual exclusion in Operating Systems. The application is built entirely with vanilla web technologies (HTML, CSS, JavaScript) and features a modern, aesthetic user interface.

## 🚀 Features
- **Interactive Execution**: Manually step through Process 0 and Process 1 line-by-line.
- **Auto-Play Simulation**: Watch the algorithm execute dynamically with randomly randomized process scheduling to test the mutual exclusion constraints in real-time.
- **Live Memory Visualization**: See real-time updates for shared memory variables (`flag[0]`, `flag[1]`, `turn`).
- **Code Highlighting**: The currently executing line of code is highlighted. Different colors denote distinct execution states (active execution, busy waiting loop, critical section entry).
- **Aesthetic GUI**: Modern "glassmorphism" design providing an intuitive and pleasing learning environment.

## 📁 Project Structure
- `index.html`: The structural markup and layout of the simulator.
- `style.css`: The styling, themes, and micro-animations driving the visual layout.
- `script.js`: The underlying state machine executing Peterson's algorithm logic.

## 💻 How to Run
Since this is built with vanilla web technologies, there are no dependencies or build steps required.
1. Open the project folder.
2. Double-click the `index.html` file to open it in your preferred web browser (e.g., Chrome, Edge, Firefox).

## 🧠 About Peterson's Solution
Peterson's Solution is a classic concurrent programming algorithm for **mutual exclusion** that allows two processes to share a single-use resource without conflict. 

It guarantees three essential conditions of synchronization:
1. **Mutual Exclusion**: Only one process can execute inside the critical section at a given time.
2. **Progress**: If no process is in the critical section and some processes wish to enter, they cannot be postponed indefinitely.
3. **Bounded Waiting**: After a process requests entry to the critical section, there is a limit on the number of times other processes are allowed to enter before the request is granted.

### Algorithm Breakdown
The algorithm utilizes two shared variables:
- `flag[i] = true`: Indicates that Process `i` wants to enter the Critical Section.
- `turn`: Determines whose turn it is to enter the Critical Section if both processes want to enter simultaneously.

A process sets its `flag` to true to indicate its desire, but graciously hands over the `turn` to the other process. It then waits in a `while` loop until either the other process is no longer interested (`flag[other] == false`), or it is currently its own turn (`turn == i`).
