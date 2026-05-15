document.addEventListener('DOMContentLoaded', () => {
    const DOM = {
        lock: document.getElementById('cas-lock-val'),
        waiting: [
            document.getElementById('cas-waiting0-val'),
            document.getElementById('cas-waiting1-val'),
            document.getElementById('cas-waiting2-val')
        ],
        boxes: {
            lock: document.getElementById('cas-lock-box'),
            waiting: [
                document.getElementById('cas-waiting0-box'),
                document.getElementById('cas-waiting1-box'),
                document.getElementById('cas-waiting2-box')
            ]
        },
        status: [
            document.getElementById('cas-p0-status'),
            document.getElementById('cas-p1-status'),
            document.getElementById('cas-p2-status')
        ],
        panels: [
            document.getElementById('cas-p0-panel'),
            document.getElementById('cas-p1-panel'),
            document.getElementById('cas-p2-panel')
        ],
        btns: [
            document.getElementById('cas-btn-step-p0'),
            document.getElementById('cas-btn-step-p1'),
            document.getElementById('cas-btn-step-p2')
        ],
        btnReset: document.getElementById('cas-btn-reset'),
        btnAuto: document.getElementById('cas-btn-auto'),
        csBox: document.getElementById('cas-cs-box')
    };

    let state = {
        lock: 0,
        waiting: [false, false, false],
        pc: [1, 1, 1],
        key: [0, 0, 0],
        j: [0, 0, 0],
        autoPlayInterval: null
    };

    function highlightVar(type, index, pid, action) {
        let el;
        let marker;
        if (type === 'lock') {
            el = DOM.boxes.lock;
            marker = document.getElementById('marker-cas-lock');
        } else {
            el = DOM.boxes.waiting[index];
            marker = document.getElementById(`marker-cas-waiting${index}`);
        }
        
        if (el) {
            el.classList.add('highlight');
            setTimeout(() => el.classList.remove('highlight'), 500);
        }
        
        if (marker && pid !== undefined) {
            marker.textContent = `← P${pid} ${action}`;
            let color = '#60a5fa'; // P0
            if (pid === 1) color = '#fbbf24'; // P1
            if (pid === 2) color = '#a78bfa'; // P2
            marker.style.color = color;
            marker.classList.add('show');
            setTimeout(() => marker.classList.remove('show'), 800);
        }
    }

    function updateUI() {
        DOM.lock.textContent = state.lock.toString();
        for (let i = 0; i < 3; i++) {
            DOM.waiting[i].textContent = state.waiting[i].toString();
        }

        // Reset code highlights
        document.querySelectorAll('#cas-tab .code-line').forEach(el => {
            el.classList.remove('active', 'wait', 'cs-active');
        });

        // Highlight PC for all 3 processes
        for (let i = 0; i < 3; i++) {
            if (state.pc[i] > 0) {
                const line = document.getElementById(`cas-p${i}-line-${state.pc[i]}`);
                if (line) {
                    if (state.pc[i] === 4 || state.pc[i] === 9) line.classList.add('wait');
                    else if (state.pc[i] === 6) line.classList.add('cs-active');
                    else line.classList.add('active');
                }
            }
            updateStatusVisuals(i);
        }

        updateCSVisuals();
    }

    function updateStatusVisuals(pid) {
        const statusEl = DOM.status[pid];
        const panel = DOM.panels[pid];
        const semaphore = document.getElementById(`cas-p${pid}-semaphore`);
        const redLight = semaphore.querySelector('.red');
        const yellowLight = semaphore.querySelector('.yellow');
        const greenLight = semaphore.querySelector('.green');
        const pc = state.pc[pid];
        
        panel.classList.remove('active', 'in-cs');
        redLight.classList.remove('active');
        yellowLight.classList.remove('active');
        greenLight.classList.remove('active');
        
        if (pc >= 1 && pc <= 2) {
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
        } else if (pc >= 7 && pc <= 11) {
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
        DOM.csBox.className = 'cs-box';
        DOM.csBox.innerHTML = '<div class="cs-empty-text">Empty</div>';

        for (let i = 0; i < 3; i++) {
            if (state.pc[i] === 6) {
                DOM.csBox.classList.add(`occupied-p${i}`);
                if (i === 2) DOM.csBox.style.borderColor = '#a78bfa'; // Quick override for P2 styling
                DOM.csBox.innerHTML = `<div class="occupant p${i}">P${i} in CS</div>`;
                break;
            }
        }
    }

    function stepProcess(i) {
        let nextPc = state.pc[i];

        switch(state.pc[i]) {
            case 1: // waiting[i] = true
                state.waiting[i] = true;
                highlightVar('waiting', i, i, 'writing');
                nextPc = 2;
                break;
            case 2: // key = 1
                state.key[i] = 1;
                nextPc = 3;
                break;
            case 3: // while(waiting[i] && key == 1)
                highlightVar('waiting', i, i, 'reading');
                if (state.waiting[i] && state.key[i] === 1) {
                    nextPc = 4;
                } else {
                    nextPc = 5;
                }
                break;
            case 4: // key = CAS(&lock, 0, 1)
                const oldLock = state.lock;
                if (oldLock === 0) {
                    state.lock = 1;
                    state.key[i] = 0;
                } else {
                    state.key[i] = 1;
                }
                highlightVar('lock', null, i, 'CAS');
                nextPc = 3;
                break;
            case 5: // waiting[i] = false
                state.waiting[i] = false;
                highlightVar('waiting', i, i, 'writing');
                nextPc = 6;
                break;
            case 6: // CRITICAL SECTION
                nextPc = 7;
                break;
            case 7: // j = (i + 1) % 3
                state.j[i] = (i + 1) % 3;
                nextPc = 8;
                break;
            case 8: // while((j != i) && !waiting[j])
                if (state.j[i] !== i) {
                    highlightVar('waiting', state.j[i], i, 'reading');
                }
                if (state.j[i] !== i && !state.waiting[state.j[i]]) {
                    nextPc = 9;
                } else {
                    nextPc = 10;
                }
                break;
            case 9: // j = (j + 1) % 3
                state.j[i] = (state.j[i] + 1) % 3;
                nextPc = 8;
                break;
            case 10: // if(j == i) lock = 0; else -> 11
                if (state.j[i] === i) {
                    state.lock = 0;
                    highlightVar('lock', null, i, 'writing');
                    nextPc = 1; // Restart
                } else {
                    nextPc = 11;
                }
                break;
            case 11: // else waiting[j] = false
                state.waiting[state.j[i]] = false;
                highlightVar('waiting', state.j[i], i, 'writing');
                nextPc = 1; // Restart
                break;
        }

        state.pc[i] = nextPc;
        updateUI();
    }

    DOM.btns.forEach((btn, i) => {
        btn.addEventListener('click', () => stepProcess(i));
    });

    DOM.btnReset.addEventListener('click', () => {
        state = {
            lock: 0,
            waiting: [false, false, false],
            pc: [1, 1, 1],
            key: [0, 0, 0],
            j: [0, 0, 0],
            autoPlayInterval: state.autoPlayInterval
        };
        updateUI();
    });

    DOM.btnAuto.addEventListener('click', () => {
        if (state.autoPlayInterval) {
            clearInterval(state.autoPlayInterval);
            state.autoPlayInterval = null;
            DOM.btnAuto.textContent = 'Auto Play: Off';
            DOM.btnAuto.classList.remove('primary');
            DOM.btnAuto.classList.add('secondary');
            DOM.btns.forEach(b => b.disabled = false);
        } else {
            DOM.btnAuto.textContent = 'Auto Play: On';
            DOM.btnAuto.classList.remove('secondary');
            DOM.btnAuto.classList.add('primary');
            DOM.btns.forEach(b => b.disabled = true);
            
            state.autoPlayInterval = setInterval(() => {
                let pick = Math.floor(Math.random() * 3);
                stepProcess(pick);
            }, 600);
        }
    });

    // Initial render
    updateUI();
});
