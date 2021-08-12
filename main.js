const BOMB = '💣';
const FLAG = '❌';
const LIFE = '💜';
const SMILEY = '😁';

var gLives = 3;
var gDidPlaceMines = false;
var gInterval = null;
var gBoard = [];
var gSmileyTimeout = null;

var gLevel = {
    SIZE: 6,
    MINES: 3
};

var gGame = {
    isOn: false,
    secsPassed: 0
};

initGame();
const backgroundTrack = new Audio('/sound/Brave Space Explorers.mp3').play();

function initGame() {
    var elMsg = document.querySelector(".msg");
    
    elMsg.style.visibility = "hidden";
    gGame.isOn = true;
    gBoard = buildBoard();
    gLives = 3;
    renderBoard(gBoard, '.game-container');
    elMsg.innerHTML = '';
    stopTimer();
    showTimer();
    gDidPlaceMines = false;
    changeSmiley(SMILEY, false);
}

function changeSmiley(val, shouldTimeout) {
    var elSmiley = document.querySelector(".smiley");
    elSmiley.innerHTML = val;
    clearInterval(gSmileyTimeout);
    if(shouldTimeout){
        gSmileyTimeout = setTimeout(() => {
            elSmiley.innerHTML = SMILEY;
        }, 1000);
    }
}

function buildBoard() {
    var board = [];
    for(var i = 0; i < gLevel.SIZE; i++) {
        board.push([]);
        for(var j = 0; j < gLevel.SIZE; j++) {
            board[i].push({
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false,
                wasExposed: false,
                i:i,
                j:j
            });
        }
    }
    
    return board;
}

function setMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var neighbourCells = surroundings(board, i, j);
            for (var n = 0; n < neighbourCells.length; n++) {
                if (neighbourCells[n].isMine) {
                    board[i][j].minesAroundCount++;
                }
            }
        }
    }
}

function renderBoard(mat, selector) {
    var cellId = 1;
    var strHTML = '<table><tbody>';
    for (var i = 0; i < mat.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < mat[0].length; j++) {
            var cell = mat[i][j];
            var className = 'cell cell' + i + '-' + j;
            if (cell.isShown) {
                if(!cell.isMine) {
                    strHTML += '<td class="' + className + ' shown-cell' + '" id="' + cellId + '" onClick="cellClicked(this, ' + i + ',' + j + ')"> <span>' + prettyPrintCell(cell) + '</span> </td>';
                } else {
                    strHTML += '<td class="' + className + ' bomb-cell' + '" id="' + cellId + '" onClick="cellClicked(this, ' + i + ',' + j + ')"> <span>' + BOMB + '</span> </td>';
                }
            }
            else {
                if (cell.isMarked) {
                    strHTML += '<td class="' + className + ' marked-cell' + '" id="' + cellId + '" onClick="cellClicked(this, ' + i + ',' + j + ')" onContextMenu="return cellMarked(this, ' + i + ',' + j + ');"> ' + FLAG + ' </td>';        
                } else {
                    strHTML += '<td class="' + className + ' hidden-cell' + '" id="' + cellId + '" onClick="cellClicked(this, ' + i + ',' + j + ')" onContextMenu="return cellMarked(this, ' + i + ',' + j + ');"> </td>';        
                }
            }
            
            cellId++;
        }
        strHTML += '</tr>';
    }
    strHTML += '</tbody></table>';
    var elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
    printLives();
}

function printLives() {
    var elLife = document.querySelector(".life-container");
    var strHTML = '';
    for(var i = 0; i < gLives; i++) {
        strHTML += LIFE;
    }
    elLife.innerHTML = strHTML;
}

function prettyPrintCell(cell) {
    if (cell.minesAroundCount == 0) return '';
    else return cell.minesAroundCount;
}

function cellClicked(elCell, i, j) {
    var playBoom = false;
    if(!gDidPlaceMines){
        for(var n = 0; n < gLevel.MINES; n++) {
            var row = getRandomInt(0, gLevel.SIZE - 1);
            var col = getRandomInt(0, gLevel.SIZE - 1);
            while (row == i && col == j) {
                row = getRandomInt(0, gLevel.SIZE - 1);
                col = getRandomInt(0, gLevel.SIZE - 1);
            }
            gBoard[row][col].isMine = true;
        }
        setMinesNegsCount(gBoard);
        gDidPlaceMines = true;
    }
    if(!gGame.isOn || gBoard[i][j].isMarked) {
        return;
    } else if(gBoard[i][j].isMine && !gBoard[i][j].isShown) {
        gLives --;
        changeSmiley('🤯', true);
        playBoom = true;
        if(!gLives) {
            death();
        }
    } else {
        startTimer();
        exposeAround(i, j);
    }
    
    gBoard[i][j].isShown = true;
    checkGameOver();    
    renderBoard(gBoard, '.game-container');

    if (playBoom) {
        let boom = new Audio('/sound/explosion.flac').play()
        boom.pause();
    }
}

function exposeAround(i, j) {
    gBoard[i][j].wasExposed = true;
    if(!gBoard[i][j].minesAroundCount) {
        var neighbourCells = surroundings(gBoard, i, j);
        for (var n = 0; n < neighbourCells.length; n++) {
            if(!neighbourCells[n].isMarked) {
                neighbourCells[n].isShown = true;
                if (!neighbourCells[n].wasExposed) {
                    exposeAround(neighbourCells[n].i, neighbourCells[n].j);
                }
            }
        }
    }
}

function cellMarked(elCell, i, j) {
    if(!gGame.isOn) {
        return false;
    }
    gBoard[i][j].isMarked = !gBoard[i][j].isMarked;
    checkGameOver();
    renderBoard(gBoard, '.game-container');
    return false;
}

function death() {
    var elMsg = document.querySelector(".msg");
    stopTimer();
    gGame.isOn = false;
    elMsg.innerHTML = `Oopsy! You died 💀<br><button onclick="playAgain()">Try again`;
    elMsg.style.visibility = "visible";
    changeSmiley('🤯', false);
}

function checkGameOver() {
    for(var i = 0; i < gLevel.SIZE; i++) {
        for(var j = 0; j < gLevel.SIZE; j++) {
            var currCell = gBoard[i][j];
            if(currCell.isMine && (!currCell.isMarked && !currCell.isShown)) {
                return;
            }
            if(!currCell.isMine && !currCell.isShown) {
                return;
            }
        }
    }
    gameOver();
}

function playAgain() {
    initGame();

}

function gameOver() {
    var elMsg = document.querySelector(".msg");
    stopTimer();
    gGame.isOn = false;
    elMsg.innerHTML = `Congratulations! You have won!<br><button onclick="playAgain()">Play again`;
    elMsg.style.visibility = "visible";
    changeSmiley('😎', false);
    // backgroundTrack.pause();
    // let victory = new Audio('/sound/fanfare - victory road II.mp3').play();
    // victory.pause();
}

function getCell(mat, i, j) {
    var noValue = null;
    var value;
    var hasValue;
    
    hasValue = mat[i][j];
    value = hasValue ? mat[i][j] : noValue;

    return value;
}

function getCellSafe(mat, i, j, numRows, numCols) {
    if (i >= 0 && i < numRows && j >= 0 && j < numCols) {
        return getCell(mat, i, j);
    }
    return null;
}

function surroundings(mat, i, j) {
    var numRows = mat.length;
    var numCols = mat[0].length;

    return [
            getCellSafe(mat, i-1, j, numRows, numCols),
            getCellSafe(mat, i-1, j+1, numRows, numCols),
            getCellSafe(mat, i,   j+1, numRows, numCols),
            getCellSafe(mat, i+1, j+1, numRows, numCols),
            getCellSafe(mat, i+1, j, numRows, numCols),
            getCellSafe(mat, i+1, j-1, numRows, numCols),
            getCellSafe(mat, i,   j-1, numRows, numCols),
            getCellSafe(mat, i-1, j-1, numRows, numCols)
        ].filter(function(cell) { 
            return cell != null; 
        });
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function onTimer() {
    gGame.secsPassed++;
    showTimer();
}

function showTimer() {
    var elTimer = document.querySelector(".time-container");
    elTimer.innerHTML = `Time: ${gGame.secsPassed.toString().padStart(3, 0)}s`;
}

function startTimer() {
    showTimer();
    if (!gInterval) {
        gInterval = setInterval(onTimer, 1000);
    }
}

function stopTimer() {
    if (gInterval) {
        clearInterval(gInterval);
        gInterval = null;
        gGame.secsPassed = 0;
    }
}

function onDifficultyChanged() {
    var elDifficulty = document.getElementById("difficulty");
    switch (elDifficulty.value) {
        case "easy":
        gLevel.SIZE = 6;
        gLevel.MINES = 3;
        break;
        case "normal":
        gLevel.SIZE = 7;
        gLevel.MINES = 7;
        break;
        case "hard":
        gLevel.SIZE = 10;
        gLevel.MINES = 20;
        break;
        case "evil":
            gLevel.SIZE = 11;
            gLevel.MINES = 30;
            break;
    }
    initGame();
}