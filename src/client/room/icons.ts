export const micButton = document.getElementById('mic_button_container');
export const videoButton = document.getElementById('video_button_container');
export const screenButton = document.getElementById('screen_button_container');
export const disconnectButton = document.getElementById('disconnect_button_container');

const micIcon = `
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
viewBox="0 0 435.2 435.2" style="enable-background:new 0 0 435.2 435.2;" xml:space="preserve">
<g>
<g>
   <path d="M356.864,224.768c0-8.704-6.656-15.36-15.36-15.36s-15.36,6.656-15.36,15.36c0,59.904-48.64,108.544-108.544,108.544
       c-59.904,0-108.544-48.64-108.544-108.544c0-8.704-6.656-15.36-15.36-15.36c-8.704,0-15.36,6.656-15.36,15.36
       c0,71.168,53.248,131.072,123.904,138.752v40.96h-55.808c-8.704,0-15.36,6.656-15.36,15.36s6.656,15.36,15.36,15.36h142.336
       c8.704,0,15.36-6.656,15.36-15.36s-6.656-15.36-15.36-15.36H232.96v-40.96C303.616,355.84,356.864,295.936,356.864,224.768z"/>
</g>
</g>
<g>
<g>
   <path d="M217.6,0c-47.104,0-85.504,38.4-85.504,85.504v138.752c0,47.616,38.4,85.504,85.504,86.016
       c47.104,0,85.504-38.4,85.504-85.504V85.504C303.104,38.4,264.704,0,217.6,0z"/>
</g>
</g>
</svg>`;

const videoIcon = `
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 76 76" style="enable-background:new 0 0 76 76;" xml:space="preserve">
<g id="_x37_7_Essential_Icons_72_">
	<path id="Video_Camera" d="M72.9,14.4L56,25.3V22c0-4.4-3.6-8-8-8H8c-4.4,0-8,3.6-8,8v32c0,4.4,3.6,8,8,8h40c4.4,0,8-3.6,8-8v-3.3   l16.9,10.9c1.9,1,3.1-0.7,3.1-1.7V16C76,15,74.9,13.2,72.9,14.4z M52,54c0,2.2-1.8,4-4,4H8c-2.2,0-4-1.8-4-4V22c0-2.2,1.8-4,4-4h40   c2.2,0,4,1.8,4,4V54z M72,56.3L56,46V30l16-10.3V56.3z"/>
</g>
</svg>
`;

const screenIcon = `
<svg id="Capa_1" enable-background="new 0 0 512 512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><g><path d="m482 25h-452c-16.542 0-30 13.458-30 30v298c0 16.542 13.458 30 30 30h147v74h-81c-8.284 0-15 6.716-15 15s6.716 15 15 15h320c8.284 0 15-6.716 15-15s-6.716-15-15-15h-81v-74h147c16.542 0 30-13.458 30-30v-298c0-16.542-13.458-30-30-30zm-177 432h-98v-74h98zm177-104c-13.157 0-441.456 0-452 0v-298h452c.019 304.472.1 298 0 298z"/></g></svg>
`;

const disconnectIcon = `
<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
<g>
	<g>
		<path d="M255.15,468.625H63.787c-11.737,0-21.262-9.526-21.262-21.262V64.638c0-11.737,9.526-21.262,21.262-21.262H255.15
			c11.758,0,21.262-9.504,21.262-21.262S266.908,0.85,255.15,0.85H63.787C28.619,0.85,0,29.47,0,64.638v382.724
			c0,35.168,28.619,63.787,63.787,63.787H255.15c11.758,0,21.262-9.504,21.262-21.262
			C276.412,478.129,266.908,468.625,255.15,468.625z"/>
	</g>
</g>
<g>
	<g>
		<path d="M505.664,240.861L376.388,113.286c-8.335-8.25-21.815-8.143-30.065,0.213s-8.165,21.815,0.213,30.065l92.385,91.173
			H191.362c-11.758,0-21.262,9.504-21.262,21.262c0,11.758,9.504,21.263,21.262,21.263h247.559l-92.385,91.173
			c-8.377,8.25-8.441,21.709-0.213,30.065c4.167,4.21,9.653,6.336,15.139,6.336c5.401,0,10.801-2.041,14.926-6.124l129.276-127.575
			c4.04-3.997,6.336-9.441,6.336-15.139C512,250.302,509.725,244.88,505.664,240.861z"/>
	</g>
</g>
</svg>
`;

const arrowIcon = `
<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 viewBox="0 0 492.004 492.004" style="enable-background:new 0 0 492.004 492.004;" xml:space="preserve">
<g>
	<g>
		<path d="M382.678,226.804L163.73,7.86C158.666,2.792,151.906,0,144.698,0s-13.968,2.792-19.032,7.86l-16.124,16.12
			c-10.492,10.504-10.492,27.576,0,38.064L293.398,245.9l-184.06,184.06c-5.064,5.068-7.86,11.824-7.86,19.028
			c0,7.212,2.796,13.968,7.86,19.04l16.124,16.116c5.068,5.068,11.824,7.86,19.032,7.86s13.968-2.792,19.032-7.86L382.678,265
			c5.076-5.084,7.864-11.872,7.848-19.088C390.542,238.668,387.754,231.884,382.678,226.804z"/>
	</g>
</g>
</svg>
`;

export const setIconEnabled = (element: HTMLElement, enabled: boolean) => {
	element.style.fill = enabled ? 'rgb(13, 189, 0)' : 'rgb(255, 255, 255)';
}

micButton.innerHTML = micIcon;
videoButton.innerHTML = videoIcon;
screenButton.innerHTML = screenIcon;
disconnectButton.innerHTML = disconnectIcon;

setIconEnabled(micButton, false);
setIconEnabled(videoButton, false);
setIconEnabled(screenButton, false);
disconnectButton.style.fill = 'red';

const chatButton = document.getElementById('chat_button');
chatButton.innerHTML = arrowIcon;
setIconEnabled(chatButton, false);
chatButton.style.stroke = '#000000';
chatButton.style.strokeWidth = '12';
