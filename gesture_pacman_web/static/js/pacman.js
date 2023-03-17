let score = 0;
let gameLost = 0;
let gameWon = 0;
let intersection = true;
let prediction = '';
let currentDir = '';
let checkFor = '';
let gameRunning = ''

function updatePrediction() {
    $.get("/get_prediction", function(data) {
        var prediction = data.prediction;
        return prediction;
    });
}

function startVideo() {
    $('#video').attr('src', video_url);
}

function stopVideo() {
    $('#video').attr('src', no_video_url);
}

function initGrid(grid, layout) {
    var legend = {0: 'dot', 1: 'wall', 2: 'ghost-lair', 3: 'power-pellet', 4: 'empty'}

    for (let i=0; i < layout.length; i++) {
        var square = document.createElement('div')
        square.classList.add(legend[layout[i]])
        grid.appendChild(square)
    }
}

function goDir(grid, dir, width) {
    switch(dir) {
        case 'left':
            if (pacmanIndex % width !== 0 && 
                !grid.children.item(pacmanIndex-1).classList.contains('wall') && 
                !grid.children.item(pacmanIndex-1).classList.contains('ghost-lair')
            ) {
                pacmanIndex -= 1
            }

            // let pacman pass from one exit to another
            if ((pacmanIndex-1) === 363) {
                pacmanIndex = 391
            }
            break;

        case 'right':
            if (pacmanIndex % width !== 0 && 
                !grid.children.item(pacmanIndex+1).classList.contains('wall') && 
                !grid.children.item(pacmanIndex+1).classList.contains('ghost-lair')
            ) {
                pacmanIndex += 1
            }

            // let pacman pass from one exit to another
            if ((pacmanIndex+1) === 392) {
                pacmanIndex = 364
            }
            break; 

        case 'up':
            if (pacmanIndex-width >= 0 &&
                !grid.children.item(pacmanIndex-width).classList.contains('wall') &&
                !grid.children.item(pacmanIndex-width).classList.contains('ghost-lair')
            ) {
                pacmanIndex -= width
            }
            break

        case 'down':
            if (pacmanIndex+width < width*width &&
                !grid.children.item(pacmanIndex+width).classList.contains('wall') &&
                !grid.children.item(pacmanIndex+width).classList.contains('ghost-lair')
            ) {
                pacmanIndex += width
            }
            break
        }
}

function isCheckForPossible(grid, width) {
    switch(checkFor) {
        case 'left':
            if (pacmanIndex % width !== 0 && 
                !grid.children.item(pacmanIndex-1).classList.contains('wall') && 
                !grid.children.item(pacmanIndex-1).classList.contains('ghost-lair')
            ) {
                console.log('Check for left')
                return true
            }

            // let pacman pass from one exit to another
            if ((pacmanIndex-1) === 363) {
                console.log('Check for left')
                return true
            }
            break;

        case 'right':
            if (pacmanIndex % width !== 0 && 
                !grid.children.item(pacmanIndex+1).classList.contains('wall') && 
                !grid.children.item(pacmanIndex+1).classList.contains('ghost-lair')
            ) {
                console.log('Check for right')
                return true
            }

            // let pacman pass from one exit to another
            if ((pacmanIndex+1) === 392) {
                console.log('Check for right')
                return true
            }
            break; 

        case 'up':
            if (pacmanIndex-width >= 0 &&
                !grid.children.item(pacmanIndex-width).classList.contains('wall') &&
                !grid.children.item(pacmanIndex-width).classList.contains('ghost-lair')
            ) {
                console.log('Check for up')
                return true
            }
            break

        case 'down':
            if (pacmanIndex+width < width*width &&
                !grid.children.item(pacmanIndex+width).classList.contains('wall') &&
                !grid.children.item(pacmanIndex+width).classList.contains('ghost-lair')
            ) {
                console.log('Check for down')
                return true
            }
            break
    }

    console.log('Check for false')
    return false;
}

function movePacman(grid, initialIndex, width) {
    pacmanIndex = initialIndex;
    grid.children.item(pacmanIndex).classList.remove('pacman')

    if (isCheckForPossible(grid, width)) {
        goDir(grid, checkFor, width)
        currentDir = checkFor;
    } else {
        console.log('going ' + currentDir)
        goDir(grid, currentDir, width);
    }

/*     switch(prediction) {
        case 'left':
            if (pacmanIndex % width !== 0 && 
                !grid.children.item(pacmanIndex-1).classList.contains('wall') && 
                !grid.children.item(pacmanIndex-1).classList.contains('ghost-lair')
            ) {
                console.log('moved')
                pacmanIndex -= 1
                currentDir = prediction;
                intersection = false;
            }

            // let pacman pass from one exit to another
            if ((pacmanIndex-1) === 363) {
                pacmanIndex = 391
                currentDir = prediction;
                intersection = false;
            }
            break;

        case 'right':
            if (pacmanIndex % width !== 0 && 
                !grid.children.item(pacmanIndex+1).classList.contains('wall') && 
                !grid.children.item(pacmanIndex+1).classList.contains('ghost-lair')
            ) {
                pacmanIndex += 1
                currentDir = prediction;
                intersection = false;
            }

            // let pacman pass from one exit to another
            if ((pacmanIndex+1) === 392) {
                pacmanIndex = 364
                currentDir = prediction;
                intersection = false;
            }
            break; 

        case 'up':
            if (pacmanIndex-width >= 0 &&
                !grid.children.item(pacmanIndex-width).classList.contains('wall') &&
                !grid.children.item(pacmanIndex-width).classList.contains('ghost-lair')
            ) {
                pacmanIndex -= width
                currentDir = prediction;
                intersection = false;
            }
            break

        case 'down':
            if (pacmanIndex+width < width*width &&
                !grid.children.item(pacmanIndex+width).classList.contains('wall') &&
                !grid.children.item(pacmanIndex+width).classList.contains('ghost-lair')
            ) {
                pacmanIndex += width
                currentDir = prediction;
                intersection = false;
            }
            break
        } */

    grid.children.item(pacmanIndex).classList.add('pacman')

    return pacmanIndex;
    // check for eaten dot, eaten power pellet, game over, win
}

class Ghost {
    constructor(className, startIndex, speed) {
        this.className = className;
        this.startIndex = startIndex;
        this.speed = speed;
        this.currentIndex = startIndex;
        this.timerId = NaN;
        this.isScared = false;
    }
}

function moveGhost(ghost, width, grid, scoreDisplay) {
    const dirs = [-1, 1, width, -width];
    let dir = dirs[Math.floor(Math.random()*dirs.length)]

    ghost.timerId = setInterval(function() {
        // if clear square, go there
        if (!grid.children.item(ghost.currentIndex+dir).classList.contains('wall') &&
            !grid.children.item(ghost.currentIndex+dir).classList.contains('ghost')) {
                // remove the ghost
                grid.children.item(ghost.currentIndex).classList.remove(ghost.className, 'ghost', 'scared-ghost');
                
                // reassign ghost index
                ghost.currentIndex += dir

                // render ghost again
                grid.children.item(ghost.currentIndex).classList.add(ghost.className, 'ghost')
            }

        // else find another direction
        else dir = dirs[Math.floor(Math.random()*dirs.length)]

        if (ghost.isScared) {
            grid.children.item(ghost.currentIndex).classList.add('scared-ghost')

            if (grid.children.item(ghost.currentIndex).classList.contains('pacman')) {
                grid.children.item(ghost.currentIndex).classList.remove(ghost.className, 'ghost', 'scared-ghost');
                ghost.currentIndex = ghost.startIndex;
                score += 100;
                scoreDisplay.innerHTML = score;
                grid.children.item(ghost.currentIndex).classList.add(ghost.className, 'ghost')
            }
        } else {
            if (grid.children.item(ghost.currentIndex).classList.contains('pacman')) {
                gameLost = 1;
                document.getElementById('toggleGame').click();
            }
        }



    }, ghost.speed)
}

function unscareGhosts(ghosts) {
    ghosts.forEach(ghost => ghost.isScared = false)
}

jQuery( document ).ready(function($) {
    const grid = document.querySelector('.pacman-grid')
    const scoreDisplay = document.getElementById('score')
    const width = 28
    const pacmanSpeed = 500;
    let isGameRunning = false;
    let getPredictionInterval;

    $.getJSON("/get_cameras", function (data) {
        $.each(data, function (index, value) {
            $('#camera-selector').append($('<option>', { value: value, text: 'Camera ' + value }));
        });
    });

    var csrf_token = "{{ csrf_token() }}";
    $("#camera-selector").change(function () {
        var camera_id = $("#camera-selector").val();
        $.ajax({
          url: "/set_camera",
          type: "POST",
          data: { "camera_id": camera_id, "csrf_token": csrf_token },
          success: function (response) {
            console.log(response);
            if (isGameRunning) {
                startVideo()
            }
          },
          error: function (error) {
            console.log("Error setting the camera ID");
          }
        });
    });

    /* 
    Grid legend classes: 
    0 - dot
    1 - wall
    2 - ghost-lair
    3 - power-pellet
    4 - empty
    */
    const layout = [
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
        1,3,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,3,1,
        1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,
        1,0,1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,1,1,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1,
        1,1,1,1,1,1,0,1,1,4,4,4,4,4,4,4,4,4,4,1,1,0,1,1,1,1,1,1,
        1,1,1,1,1,1,0,1,1,4,1,1,1,2,2,1,1,1,4,1,1,0,1,1,1,1,1,1,
        1,1,1,1,1,1,0,1,1,4,1,2,2,2,2,2,2,1,4,1,1,0,1,1,1,1,1,1,
        4,4,4,4,4,4,0,0,0,4,1,2,2,2,2,2,2,1,4,0,0,0,4,4,4,4,4,4,
        1,1,1,1,1,1,0,1,1,4,1,2,2,2,2,2,2,1,4,1,1,0,1,1,1,1,1,1,
        1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1,
        1,1,1,1,1,1,0,1,1,4,1,1,1,1,1,1,1,1,4,1,1,0,1,1,1,1,1,1,
        1,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,1,
        1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
        1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,
        1,3,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,3,1,
        1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,
        1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1,
        1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1,
        1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,
        1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1,
        1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
        1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1
      ]

    initGrid(grid, layout)

    // place PacMan to the grid
    let pacmanIndex = 490
    grid.children.item(pacmanIndex).classList.add('pacman')

    // make ghosts
    let ghosts = [
        new Ghost('blinky', 348, 350),
        new Ghost('pinky', 376, 500),
        new Ghost('inky', 351, 400),
        new Ghost('clyde', 379, 500)
    ]

    // draw each ghost
    ghosts.forEach(ghost => {
        grid.children.item(ghost.currentIndex).classList.add('ghost', ghost.className)
    })

    document.getElementById('toggleGame').addEventListener('click', function() {
        if (!isGameRunning) {
            startVideo();
            gameLost = 0;
            gameWon = 0;

            document.getElementById('toggleGame').innerHTML = 'RESTART'

            // move the ghosts
            // in PacMan, the ghosts move to according to certain patterns; 
            // I will just be making them move randomly
            ghosts.forEach(ghost => moveGhost(ghost, width, grid, score, scoreDisplay))

            getPredictionInterval = setInterval(function() {
                $.get("/get_prediction", function(data) {
                    prediction = data.prediction;
                    checkFor = data.prediction;
                });
                pacmanIndex = movePacman(grid, pacmanIndex, width);

                // eat dot and add score if eaten
                if (grid.children.item(pacmanIndex).classList.contains('dot')) {
                    score++;
                    scoreDisplay.innerHTML = score;
                    grid.children.item(pacmanIndex).classList.remove('dot');
                    if (!grid.getElementsByClassName('dot')[0]) {
                        gameWon = 1;
                        document.getElementById('toggleGame').click()
                    }
                }

                // power pellet logic
                if (grid.children.item(pacmanIndex).classList.contains('power-pellet')) {
                    score += 10;
                    scoreDisplay.innerHTML = score;
                    ghosts.forEach(ghost => ghost.isScared = true);
                    setTimeout(function() {
                        unscareGhosts(ghosts)
                    }, 10000);
                    grid.children.item(pacmanIndex).classList.remove('power-pellet');
                }

                // check for game over
                if (grid.children.item(pacmanIndex).classList.contains('ghost') &&
                    !grid.children.item(pacmanIndex).classList.contains('scared-ghost')) {
                        gameLost = 1;
                        document.getElementById('toggleGame').click();
                }

            }, pacmanSpeed)
            isGameRunning = true;
        } else {
            clearInterval(getPredictionInterval);
            ghosts.forEach(ghost => clearInterval(ghost.timerId))
            stopVideo();

            document.getElementById('toggleGame').innerHTML = 'START GAME'

            while (grid.firstChild) {
                grid.removeChild(grid.lastChild);
            }
            initGrid(grid, layout);

            prediction = '';

            isGameRunning = false;
            score = 0;

            // reset pacman and ghost positions
            grid.children.item(pacmanIndex).classList.remove('pacman')
            pacmanIndex = 490;
            grid.children.item(pacmanIndex).classList.add('pacman')
            ghosts.forEach(function(ghost) {
                grid.children.item(ghost.currentIndex).classList.remove(ghost.className, 'ghost', 'scared-ghost')
                ghost.currentIndex = ghost.startIndex
                grid.children.item(ghost.startIndex).classList.add(ghost.className, 'ghost')
            });

            if (gameLost == 1) {
                alert('Too bad, you lost. Better luck next time!');
            }
            if (gameWon == 1) {
                alert('Congratulations, you won!');
            }
        }
    })
});