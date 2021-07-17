export function handleError(err) {
    log(err);
}

export enum Color {
    RED = "red",
    GREEN = "green",
    YELLOW = "yellow",
    CYAN = "cyan",
}

export function log(msg, color?: Color) {
    const entry = document.createElement("p");
    entry.className = "logEntry";
    entry.innerText = msg;
    entry.style.backgroundColor = color || "white";
    document.getElementById("log").appendChild(entry);
}

export function updateConnectionStatus(isConnected: boolean) {
    const el = document.getElementById("connection_status");
    if (isConnected) {
        el.style.backgroundColor = "green";
    }
    else {
        el.style.backgroundColor = "red";
    }
}

document.getElementById("toggle_log").onclick = (event) => {
    const logElement = document.getElementById("log");
    if (logElement.style.display === 'block') {
        logElement.style.display = 'none';
    }
    else {
        logElement.style.display = 'block';
    }
};
