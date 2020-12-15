export function handleError(err) {
    log(err);
}
  
export function log(msg) {
    const entry = document.createElement("p");
    entry.className = "logEntry";
    entry.innerText = msg;
    document.getElementById("log").appendChild(entry);
}

document.getElementById("toggle_log").onclick = (event) => {
    const log = document.getElementById("log");
    console.log();
    if (log.style.display === 'block') {
        log.style.display = 'none';
    }
    else {
        log.style.display = 'block';
    }
};
