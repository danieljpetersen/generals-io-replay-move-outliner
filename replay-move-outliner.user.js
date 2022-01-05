// ==UserScript==
// @name         Generals.io Replay Move Outliner
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Highlights tiles players have moved to
// @author       sub
// @match        https://generals.io/replays/*
// @match        https://*.generals.io/replays/*
// @grant        none
// @icon         https://generals.io/favicon/favicon-32x32.png
// ==/UserScript==


(function() {
    'use strict';

    let turnNumberStr = '0'; // a string because it's grabbed from the dom, where a period represents a subround, '1' -> '1.' -> '2' etc
    let curMapState = [];
    let prevMapState = [];

    const observer = new MutationObserver(mutations => {
        let turnCounterNode = document.getElementById("turn-counter");

        if (turnCounterNode !== null) {
            let updatedTurnNumber = turnCounterNode.innerText.substr(4, turnCounterNode.innerText.length-1);

            if (turnNumberStr !== updatedTurnNumber) {
                turnNumberStr = updatedTurnNumber;

                if (curMapState.length === 0) {
                    curMapState = populateMapState();
                }

                prevMapState = curMapState;
                curMapState = populateMapState();

                let gameMapNode = document.getElementById("gameMap");

                let isEndOfRound = false;
                if (turnNumberStr[turnNumberStr.length-1] !== ".") {
                	isEndOfRound = (parseInt(turnNumberStr)) % 25 === 0;
                }

                for (var y = 0; y < curMapState.length; y++) {
                    for (var x = 0; x < curMapState[y].length; x++) {
                        let element = gameMapNode.rows[y].cells[x];

                        if (hasTileChanged(prevMapState, curMapState, y, x, isEndOfRound)) {
                            element.style.outline = "4px solid black";
                            element.style.zIndex = 2;
                        }
                        else {
                            element.style.outline = "";
                            element.style.zIndex = 0;
                        }
                    }
                }
            }
        }
    });

    observer.observe(document.body, {
        subtree: true,
        childList: true,
        attributes: true
    });

    function hasCity(classList) {
        for (var i = 0; i < classList.length; i++) {
            if (classList[i] === "city") {
                return true;
            }
            if (classList[i] === "general") {
                return true;
            }
        }

        return false;
    }

    function populateMapState() {
        let mapState = [];

        let gameMapNode = document.getElementById("gameMap");
        let rowCount = gameMapNode.rows.length;
        let colCount = gameMapNode.rows[0].cells.length;

        for (var y = 0; y < rowCount; y++) {
            mapState.push([]);

            for (var x = 0; x < colCount; x++) {
                let innerText = gameMapNode.rows[y].cells[x].innerText;
                let armyCount = 0;
                if (innerText.length) {
                    armyCount = parseInt(innerText);
                }

                mapState[y].push({
                    'armyCount': armyCount,
                    'hasCity': hasCity(gameMapNode.rows[y].cells[x].classList),
                });
            }
        }

        return mapState;
    }

    function hasTileChanged(prevMapState, curMapState, y, x, isEndOfRound) {
        if (prevMapState[y][x].hasCity) {
            return false;
        }

        if (prevMapState[y][x].armyCount !== curMapState[y][x].armyCount) {
            if (isEndOfRound) {
                return (prevMapState[y][x].armyCount !== (curMapState[y][x].armyCount - 1));
            }

            return true;
        }

        return false;
    }
})();
