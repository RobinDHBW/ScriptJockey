$(document).ready(async () => {
    try {
        const mainController = new MainController();
        const router = new Scratcher();
        router.getStart();

        $.get("/config", async (data, status) => {
            try {
                if (status === "success") {
                    // const config = JSON.parse(data);
                    if (data.musicFolders.length === 0) {
                        let musicPath = "";
                        while (!musicPath || musicPath.length === 0) {
                            musicPath = window.prompt("Bitte Pfad zum mp3-Verzeichnis angeben", "");
                        }
                        data.musicFolders.push(musicPath);
                        $.post('/saveConfig', data);
                    }
                    await initID3Array();
                }
            } catch (e) { console.error(e) }
        })

        $('#searchInput').on('keyup', function () {
            const value = $(this).val().toLowerCase();
            $("#id3Table tr").filter(function () {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
            });
        });
    } catch (e) { console.error(e) }
})