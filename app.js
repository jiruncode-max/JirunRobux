/* ===== AREA GAME / BERBAGI LAYAR ===== */

let rbxDisplayStream = null;

function initGameShareArea() {
    const canvas = document.getElementById('green-canvas');

    if (!canvas || document.getElementById('rbx-share-toolbar')) {
        return;
    }

    canvas.innerHTML = `
      <div class="rbx-share-toolbar" id="rbx-share-toolbar">
        <label for="rbx-game-url">Game / URL</label>

        <input
          id="rbx-game-url"
          class="rbx-share-url"
          type="url"
          placeholder="Tempel link game atau website https://..."
          autocomplete="url"
        >

        <button class="rbx-share-btn primary" type="button"
          onclick="rbxLoadGame()">Buka Game</button>

        <button class="rbx-share-btn" type="button"
          onclick="rbxStartScreenShare()">Berbagi Layar</button>

        <button class="rbx-share-btn danger" type="button"
          onclick="rbxStopScreenShare()">Hentikan Share</button>

        <button class="rbx-share-btn" type="button"
          onclick="rbxToggleFullscreen()">Layar Penuh</button>

        <button class="rbx-share-btn" type="button"
          onclick="rbxShowGreen()">Layar Hijau</button>
      </div>

      <div class="rbx-share-stage" id="rbx-share-stage">
        <div class="rbx-share-placeholder" id="rbx-share-placeholder">
          Area game / berbagi layar
          <small>
            Masukkan URL game, atau klik “Berbagi Layar” lalu pilih
            layar, jendela, atau tab melalui dialog browser.
          </small>
        </div>
      </div>
    `;
}

function rbxLoadGame() {
    const input = document.getElementById('rbx-game-url');
    const stage = document.getElementById('rbx-share-stage');

    if (!input || !stage) return;

    let value = input.value.trim();

    if (!value) {
        ppToast('Masukkan URL game terlebih dahulu');
        input.focus();
        return;
    }

    if (!/^https?:\/\//i.test(value)) {
        value = 'https://' + value;
    }

    let parsed;

    try {
        parsed = new URL(value);
    } catch (error) {
        ppToast('URL tidak valid');
        return;
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
        ppToast('Hanya URL HTTP/HTTPS yang didukung');
        return;
    }

    rbxStopScreenShare();
    stage.innerHTML = '';

    const frame = document.createElement('iframe');

    frame.src = parsed.href;
    frame.title = 'Game yang dipilih';
    frame.allow =
        'fullscreen; autoplay; gamepad; clipboard-read; clipboard-write';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';

    stage.appendChild(frame);
    input.value = parsed.href;
}

async function rbxStartScreenShare() {
    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getDisplayMedia
    ) {
        ppToast('Browser ini tidak mendukung berbagi layar');
        return;
    }

    try {
        rbxStopScreenShare();

        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { frameRate: 30 },
            audio: true
        });

        rbxDisplayStream = stream;

        const stage = document.getElementById('rbx-share-stage');

        if (!stage) {
            stream.getTracks().forEach(track => track.stop());
            rbxDisplayStream = null;
            return;
        }

        stage.innerHTML = '';

        const video = document.createElement('video');

        video.id = 'rbx-shared-screen-video';
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.srcObject = stream;

        stage.appendChild(video);

        stream.getVideoTracks()[0]?.addEventListener(
            'ended',
            rbxStopScreenShare,
            { once: true }
        );

        ppToast('Berbagi layar aktif');
    } catch (error) {
        if (error && error.name !== 'NotAllowedError') {
            console.error('Screen share error:', error);
            ppToast('Tidak dapat memulai berbagi layar');
        }
    }
}

function rbxStopScreenShare() {
    if (rbxDisplayStream) {
        rbxDisplayStream.getTracks().forEach(track => track.stop());
        rbxDisplayStream = null;
    }

    const video = document.getElementById('rbx-shared-screen-video');

    if (video) {
        video.srcObject = null;
    }
}

function rbxShowGreen() {
    rbxStopScreenShare();

    const stage = document.getElementById('rbx-share-stage');

    if (!stage) return;

    stage.innerHTML = `
      <div class="rbx-share-placeholder">
        Layar hijau aktif
        <small>Gunakan tampilan ini sebagai green screen untuk OBS.</small>
      </div>
    `;

    stage.style.backgroundColor = '#00ff00';
}

function rbxToggleFullscreen() {
    const canvas = document.getElementById('green-canvas');

    if (!canvas) return;

    if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
        canvas.classList.remove('share-fullscreen');
    } else if (canvas.requestFullscreen) {
        canvas.requestFullscreen().catch(() => {
            canvas.classList.toggle('share-fullscreen');
        });
    } else {
        canvas.classList.toggle('share-fullscreen');
    }
}
