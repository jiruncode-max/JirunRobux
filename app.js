async function rbxStartScreenShare() {
    const stage = document.getElementById('rbx-share-stage');

    if (!stage) {
        alert('Area game tidak ditemukan.');
        return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('Jalankan website melalui localhost atau HTTPS di Chrome/Edge.');
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
        });

        rbxStopScreenShare();
        rbxDisplayStream = stream;

        stage.innerHTML = '';

        const video = document.createElement('video');
        video.id = 'rbx-shared-screen-video';
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;

        Object.assign(video.style, {
            display: 'block',
            width: '100%',
            height: '100%',
            minWidth: '0',
            minHeight: '0',
            objectFit: 'contain',
            background: '#111'
        });

        stage.appendChild(video);
        video.srcObject = stream;

        await video.play();

        stream.getVideoTracks()[0].addEventListener('ended', () => {
            rbxDisplayStream = null;
            stage.innerHTML = `
                <div class="rbx-share-placeholder">
                    Berbagi layar dihentikan.
                    <small>Klik Berbagi Layar untuk mencoba lagi.</small>
                </div>`;
        }, { once: true });

    } catch (error) {
        console.error('Kesalahan berbagi layar:', error);
        alert('Layar gagal ditampilkan: ' + (error.message || error.name));
    }
}
