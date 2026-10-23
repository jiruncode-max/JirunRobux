async function rbxStartScreenShare() {
    const stage = document.getElementById('rbx-share-stage');

    if (!stage) {
        alert('Area layar game tidak ditemukan.');
        return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
        alert(
            'Berbagi layar tidak didukung. ' +
            'Buka website melalui localhost atau HTTPS di Chrome/Edge.'
        );
        return;
    }

    try {
        // Hentikan sesi berbagi layar sebelumnya.
        rbxStopScreenShare();

        // Minta browser memilih layar atau jendela game.
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: false
        });

        rbxDisplayStream = stream;

        // Tampilkan layar yang dipilih di area game.
        stage.innerHTML = '';

        const video = document.createElement('video');
        video.id = 'rbx-shared-screen-video';
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.style.cssText =
            'width:100%;height:100%;object-fit:contain;background:#111;';

        video.srcObject = stream;
        stage.appendChild(video);

        await video.play();

        // Jika tombol Stop Sharing browser ditekan,
        // kembalikan area ke tampilan awal.
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            rbxDisplayStream = null;

            stage.innerHTML = `
                <div class="rbx-share-placeholder">
                    Berbagi layar dihentikan
                    <small>Klik Berbagi Layar untuk memilih game lagi.</small>
                </div>
            `;
        }, { once: true });

    } catch (error) {
        console.error('Gagal berbagi layar:', error);

        if (error.name === 'NotAllowedError') {
            alert('Kamu membatalkan izin berbagi layar.');
        } else {
            alert('Gagal menampilkan layar. Coba jalankan lewat localhost atau HTTPS.');
        }
    }
}
