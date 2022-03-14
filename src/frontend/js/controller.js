"use strict"
class MainController {

    constructor() {

    }

    async initID3Array() {
        try {
            // const automatedid3List = $("#automatedID3List")
            $("#automatedID3Table").empty();
            // while ($("#automatedID3Table").first()) {
            //     $("#automatedID3Table").first().remove();
            // }
            if ($("#fetchAlert")) {
                $("#fetchAlert").parent().find("#fetchAlert").remove();
            }

            $("#spinning-sheep-gatter").attr('style', 'display: flex !important');
            $.get("/id3", (data, status) => {
                // console.log(data, status);
                // const id3Array = JSON.parse(data);
                $("#spinning-sheep-gatter").attr('style', 'display: none !important');
                if (status === "success" && Array.isArray(data)) {
                    const tbody = $("#automatedID3Table");
                    data.forEach((item, index) => {
                        const tr = $("<tr class='id3table-row'></tr>").appendTo(tbody);
                        $(`<td class="text-center" id='${index}_title'>${item.title}</td>`).appendTo(tr);
                        $(`<td class="text-center" id='${index}_artist'>${item.artist}</td>`).appendTo(tr);
                        $(`<td class="text-center" id='${index}_album'>${item.album}</td>`).appendTo(tr);
                        $(`<td class="text-center" id='${index}_vote'>${item.vote}</td>`).appendTo(tr);

                        // // imageBuffer to blob - not properly working
                        // if (item.image) {
                        //     const arrayBufferView = new Uint8Array(item.image.imageBuffer);
                        //     const blob = new Blob([arrayBufferView], { type: "image/" + item.image.mime });
                        //     let imageUrl = window.URL.createObjectURL(blob);
                        //     $(`<td><img src='${imageUrl}'></td>`).appendTo(tr);
                        // }

                        tr.click(() => {
                            item.vote++;
                            $.post('/upvote', item, async (data, status) => {
                                if (data === "done") {
                                    $('#' + index + '_vote').html(item.vote);
                                } else {
                                    item.vote--;
                                }
                            })
                        })
                    })
                } else {
                    $("#main-body").append($(`<div id="fetchAlert" class='alert alert-danger'><strong>${status}</strong> | Fetch data from server failed!</div>`))
                }
            })
        } catch (e) { console.error(e) }

    }

}