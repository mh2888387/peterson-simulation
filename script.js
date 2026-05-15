document.addEventListener('DOMContentLoaded', () => {
    const DOM = {
        flag0: document.getElementById('flag0-val'),
        flag1: document.getElementById('flag1-val'),
        turn: document.getElementById('turn-val'),
        flag0Box: document.getElementById('flag0-box'),
        flag1Box: document.getElementById('flag1-box'),
        turnBox: document.getElementById('turn-box'),
        p0Status: document.getElementById('p0-status'),
        p1Status: document.getElementById('p1-status'),
        btnStepP0: document.getElementById('btn-step-p0'),
        btnStepP1: document.getElementById('btn-step-p1'),
        btnReset: document.getElementById('btn-reset'),
        btnAuto: document.getElementById('btn-auto'),
        csBox: document.getElementById('cs-box'),
        p0Panel: document.getElementById('p0-panel'),
        p1Panel: document.getElementById('p1-panel')
    };

    let state = {
        flag: [false, false],
        turn: 0,
        pc: [1, 1],
        autoPlayInterval: null
    };

    function updateUI() {
        // Update variables
        DOM.flag0.textContent = state.flag[0].toString();
        DOM.flag1.textContent = state.flag[1].toString();
        DOM.turn.textContent = state.turn.toString();

        // Reset all code highlights
        document.querySelectorAll('.code-line').forEach(el => {
            el.classList.remove('active', 'wait', 'cs-active');
        });

        // Highlight current PC for P0
        if (state.pc[0] > 0) {
            const line0 = document.getElementById(`p0-line-${state.pc[0]}`);
            if (line0) {
                if (state.pc[0] === 4) line0.classList.add('wait');
                else if (state.pc[0] === 6) line0.classList.add('cs-active');
                else line0.classList.add('active');
            }
        }

        // Highlight current PC for P1
        if (state.pc[1] > 0) {
            const line1 = document.getElementById(`p1-line-${state.pc[1]}`);
            if (line1) {
                if (state.pc[1] === 4) line1.classList.add('wait');
                else if (state.pc[1] === 6) line1.classList.add('cs-active');
                else line1.classList.add('active');
            }
        }

        // Update status and CS visuals
        updateStatusVisuals(0);
        updateStatusVisuals(1);
        updateCSVisuals();
    }

    function updateStatusVisuals(pid) {
        const statusEl = pid === 0 ? DOM.p0Status : DOM.p1Status;
        const panel = pid === 0 ? DOM.p0Panel : DOM.p1Panel;
        const semaphore = document.getElementById(`p${pid}-semaphore`);
        const redLight = semaphore.querySelector('.red');
        const yellowLight = semaphore.querySelector('.yellow');
        const greenLight = semaphore.querySelector('.green');
        const pc = state.pc[pid];

        panel.classList.remove('active', 'in-cs');
        redLight.classList.remove('active');
        yellowLight.classList.remove('active');
        greenLight.classList.remove('active');

        if (pc === 1 || pc === 2) {
            statusEl.textContent = 'Want to enter';
            statusEl.style.color = '#60a5fa';
            panel.classList.add('active');
            yellowLight.classList.add('active');
        } else if (pc === 3 || pc === 4) {
            statusEl.textContent = 'Waiting';
            statusEl.style.color = '#f87171';
            panel.classList.add('active');
            redLight.classList.add('active');
        } else if (pc === 6) {
            statusEl.textContent = 'In CS';
            statusEl.style.color = '#34d399';
            panel.classList.add('in-cs');
            greenLight.classList.add('active');
        } else if (pc === 7) {
            statusEl.textContent = 'Exiting';
            statusEl.style.color = '#a78bfa';
            panel.classList.add('active');
            yellowLight.classList.add('active');
        } else {
            statusEl.textContent = 'Idle';
            statusEl.style.color = 'inherit';
            greenLight.classList.add('active');
        }
    }

    function updateCSVisuals() {
        const inCs0 = state.pc[0] === 6;
        const inCs1 = state.pc[1] === 6;

        DOM.csBox.className = 'cs-box';

        if (inCs0) {
            DOM.csBox.classList.add('occupied-p0');
            DOM.csBox.innerHTML = '<div class="occupant p0">P0 in CS</div>';
        } else if (inCs1) {
            DOM.csBox.classList.add('occupied-p1');
            DOM.csBox.innerHTML = '<div class="occupant p1">P1 in CS</div>';
        } else {
            DOM.csBox.innerHTML = '<div class="cs-empty-text">Empty</div>';
        }
    }

    function highlightVar(varId, pid, action) {
        const el = document.getElementById(`${varId}-box`);
        const marker = document.getElementById(`marker-${varId}`);
        el.classList.add('highlight');

        if (marker && pid !== undefined) {
            marker.textContent = `← P${pid} ${action}`;
            marker.style.color = pid === 0 ? '#60a5fa' : '#fbbf24';
            marker.classList.add('show');
        }

        setTimeout(() => el.classList.remove('highlight'), 500);
    }

    function glowVar(id, type, val) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('glow-pass', 'glow-block');
        void el.offsetWidth;
        if (val !== undefined) el.setAttribute('data-value', String(val));
        el.classList.add(type === 'pass' ? 'glow-pass' : 'glow-block');
    }

    function evaluateConditions() {
        for (let i = 0; i < 2; i++) {
            const other = 1 - i;

            // Color the flag[other] in the while condition
            const flagSpan = document.getElementById(`p${i}-cv-flag${other}`);
            const turnSpan = document.getElementById(`p${i}-cv-turn-cond`);
            if (!flagSpan || !turnSpan) continue;

            // flag[other]: true = blocking, false = passing
            if (state.flag[other]) {
                glowVar(`p${i}-cv-flag${other}`, 'block', true);
            } else {
                glowVar(`p${i}-cv-flag${other}`, 'pass', false);
            }

            // turn == other: true = blocking, false = passing
            if (state.turn === other) {
                glowVar(`p${i}-cv-turn-cond`, 'block', state.turn);
            } else {
                glowVar(`p${i}-cv-turn-cond`, 'pass', state.turn);
            }
        }
    }

    function stepProcess(pid) {
        // Clear glows and markers at the start of the step
        document.querySelectorAll('#peterson-tab .cv').forEach(el => {
            el.classList.remove('glow-pass', 'glow-block');
        });
        document.querySelectorAll('#peterson-tab .mem-marker').forEach(el => {
            el.classList.remove('show');
        });

        const other = 1 - pid;
        let nextPc = state.pc[pid];

        switch (state.pc[pid]) {
            case 1: // flag[pid] = true
                state.flag[pid] = true;
                highlightVar(`flag${pid}`, pid, 'writing');
                evaluateConditions();
                nextPc = 2;
                break;
            case 2: // turn = other
                state.turn = other;
                highlightVar('turn', pid, 'writing');
                evaluateConditions();
                nextPc = 3;
                break;
            case 3: // while (flag[other] && turn == other)
                highlightVar(`flag${other}`, pid, 'reading');
                setTimeout(() => highlightVar('turn', pid, 'reading'), 300);
                if (state.flag[other] && state.turn === other) {
                    nextPc = 4; // go to wait
                } else {
                    nextPc = 6; // enter CS
                }
                break;
            case 4: // wait loop body
                nextPc = 3; // go back to while condition
                break;
            case 6: // In CS
                nextPc = 7;
                break;
            case 7: // flag[pid] = false
                state.flag[pid] = false;
                highlightVar(`flag${pid}`, pid, 'writing');
                evaluateConditions();
                nextPc = 1; // Loop back to start
                break;
        }

        state.pc[pid] = nextPc;
        updateUI();
    }

    DOM.btnStepP0.addEventListener('click', () => stepProcess(0));
    DOM.btnStepP1.addEventListener('click', () => stepProcess(1));

    DOM.btnReset.addEventListener('click', () => {
        state = {
            flag: [false, false],
            turn: 0,
            pc: [1, 1],
            autoPlayInterval: state.autoPlayInterval
        };
        document.querySelectorAll('#peterson-tab .cv').forEach(el => el.classList.remove('glow-pass', 'glow-block'));
        document.querySelectorAll('#peterson-tab .mem-marker').forEach(el => el.classList.remove('show'));
        updateUI();
        highlightVar('flag0');
        highlightVar('flag1');
        highlightVar('turn');
    });

    DOM.btnAuto.addEventListener('click', () => {
        if (state.autoPlayInterval) {
            clearInterval(state.autoPlayInterval);
            state.autoPlayInterval = null;
            DOM.btnAuto.textContent = 'Auto Play: Off';
            DOM.btnAuto.classList.remove('primary');
            DOM.btnAuto.classList.add('secondary');
            DOM.btnStepP0.disabled = false;
            DOM.btnStepP1.disabled = false;
        } else {
            DOM.btnAuto.textContent = 'Auto Play: On';
            DOM.btnAuto.classList.remove('secondary');
            DOM.btnAuto.classList.add('primary');
            DOM.btnStepP0.disabled = true;
            DOM.btnStepP1.disabled = true;

            state.autoPlayInterval = setInterval(() => {
                // Randomly pick a process to step, biased towards the one not waiting
                let pick = Math.random() > 0.5 ? 0 : 1;
                stepProcess(pick);
            }, 1500);
        }
    });

    // Initial render
    updateUI();
});
