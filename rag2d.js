const tabStates = {
    'peterson-tab': { 0: 'IDLE', 1: 'IDLE' },
    'cas-tab': { 0: 'IDLE', 1: 'IDLE', 2: 'IDLE' }
};

function getActiveCanvasInfo() {
    const activeTab = document.querySelector('.tab-pane.active');
    if (!activeTab) return null;
    const container = activeTab.querySelector('.canvas-container');
    const canvas = activeTab.querySelector('.rag-canvas');
    if (!container || !canvas) return null;
    return { container, canvas, ctx: canvas.getContext('2d'), tabId: activeTab.id };
}

function initRAG() {
    const info = getActiveCanvasInfo();
    if (!info) return;

    function resize() {
        const info = getActiveCanvasInfo();
        if (!info || !info.container.clientWidth) return;
        const { canvas, container, ctx } = info;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = container.clientWidth * dpr;
        canvas.height = container.clientHeight * dpr;
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform before scaling
        ctx.scale(dpr, dpr);
        drawRAG();
    }

    window.addEventListener('resize', resize);

    // Initial size update
    setTimeout(resize, 100);
}

window.updateRAGState = function (pid, state) {
    const info = getActiveCanvasInfo();
    if (!info) return;
    const tabId = info.tabId;

    if (tabStates[tabId][pid] !== state) {
        tabStates[tabId][pid] = state;
        drawRAG();
    }
};

function drawRAG() {
    const info = getActiveCanvasInfo();
    if (!info) return;
    const { canvas, ctx } = info;

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    if (w === 0 || h === 0) return;

    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Draw Critical Section (Resource)
    const rs = 80; // resource box size
    ctx.fillStyle = '#1e293b'; // Background color (slate-800)
    ctx.strokeStyle = '#38bdf8'; // Border color (sky-400)
    ctx.lineWidth = 3;
    ctx.fillRect(cx - rs / 2, cy - rs / 2, rs, rs);
    ctx.strokeRect(cx - rs / 2, cy - rs / 2, rs, rs);

    // Inner dot (Representing 1 instance of the resource)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fill();

    // Resource Label
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Critical Section', cx, cy + rs / 2 + 10);

    // Determine how many processes based on active tab
    const isCAS = info.tabId === 'cas-tab';
    const numProcesses = isCAS ? 3 : 2;

    // Increase radius to spread out the nodes, avoiding them being "too near"
    const radius = Math.min(w, h) * (isCAS ? 0.42 : 0.42);

    let pPositions;
    if (isCAS) {
        pPositions = {
            0: { x: -50 + cx - radius * Math.cos(Math.PI / 6), y: cy + radius * Math.sin(Math.PI / 6), color: '#3b82f6', label: 'P0' }, // bottom-left
            1: { x: 50 + cx + radius * Math.cos(Math.PI / 6), y: cy + radius * Math.sin(Math.PI / 6), color: '#fbbf24', label: 'P1' }, // bottom-right
            2: { x: cx, y: cy - radius, y: 30, color: '#a78bfa', label: 'P2' } // top
        };
    } else {
        // Peterson: Spread them horizontally on the left and right
        pPositions = {
            0: { x: -50 + cx - radius, y: cy, color: '#3b82f6', label: 'P0' }, // left
            1: { x: 50 + cx + radius, y: cy, color: '#fbbf24', label: 'P1' }  // right
        };
    }

    for (let i = 0; i < numProcesses; i++) {
        const p = pPositions[i];
        const state = tabStates[info.tabId][i];

        // Draw Directed Edges
        if (state === 'WANT') {
            // Request Edge: Process -> Resource
            drawArrow(ctx, p.x, p.y, cx, cy, '#f87171', true);
        } else if (state === 'ENTER') {
            // Assignment Edge: Resource -> Process
            drawArrow(ctx, cx, cy, p.x, p.y, '#34d399', false);
        }

        // Draw Process Node (Circle)
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 16px Inter, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.label, p.x, p.y);
    }
}

function drawArrow(ctx, fromX, fromY, toX, toY, color, isRequestEdge) {
    const headlen = 16;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    // Offset calculation to avoid drawing arrows over the shapes
    const processRadius = 25;
    const resourceHalfSize = 40; // half of rs (80/2)

    let startOffset, endOffset;

    if (isRequestEdge) {
        startOffset = processRadius + 5;
        endOffset = resourceHalfSize + 5;
    } else {
        startOffset = resourceHalfSize + 5;
        endOffset = processRadius + 5;
    }

    const startX = fromX + startOffset * Math.cos(angle);
    const startY = fromY + startOffset * Math.sin(angle);
    const endX = toX - endOffset * Math.cos(angle);
    const endY = toY - endOffset * Math.sin(angle);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(endX - headlen * Math.cos(angle - Math.PI / 6), endY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(endX - headlen * Math.cos(angle + Math.PI / 6), endY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.fill();
}

// Ensure RAG init on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initRAG, 100);
});
