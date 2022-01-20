// inject into Bread Quest

// doubles walking speed
Player.prototype.walk = function(direction) {
    if (this.walkDelay > 0) {
        return false;
    }
    if (this == localPlayer) {
        if (localCrack !== null) {
            return false;
        }
    }
    var tempPos = this.getPosInWalkDirection(direction);
    var tempTile = getTileBufferValue(tempPos);
    if (!this.canWalkThroughTile(tempTile)) {
        return false;
    }
    addWalkCommand(direction);
    this.pos.set(tempPos);
    placeLocalPlayerTrail(this.pos);
    this.walkDelay = (1 / 16) * framesPerSecond;
    return true;
}

// doubles mining speed
Player.prototype.removeTile = function(direction) {
    if (localCrack !== null) {
        return;
    }
    var tempPos = this.getPosInWalkDirection(direction);
    localCrack = new Crack(-1, tempPos, localPlayer.username);
    localCrackTile = getTileBufferValue(tempPos);
    var tempDate = new Date();
    localCrackExpirationTime = tempDate.getTime() + 500;
    addRemoveTileCommand(direction);
}

// changes zoom mode to name tag mode
function setZoom(which) {
    if (which == 0) {
        spriteRenderSize = 32;
        canvasSpriteSize = 30;
        shouldDrawNameTags = false;
    }
    if (which == 1) {
        spriteRenderSize = 32;
        canvasSpriteSize = 30;
        shouldDrawNameTags = true;
    }
}

// automatically mine all blocks with a certain id
function autoMine(id) {
	const diagonals = [
		new Pos(1, -1),
		new Pos(1, 1),
		new Pos(-1, 1),
		new Pos(-1, -1),
	]

	// automatically mine all blocks with a certain id
	function mineDiagonal(diagonalDirection) {
		function isTileEmpty(tileId) {
			return tileId === emptyTile || (tileId >= trailStartTile && tileId < trailStartTile + trailTileAmount)
		}

		let offset = diagonals[diagonalDirection]
		console.log(offset)
		let tempPos = localPlayer.pos.copy()
		tempPos.x += offset.x

		if (isTileEmpty(getTileBufferValue(tempPos))) {
			localPlayer.walk(offset.x == 1 ? 1 : 3)
			setTimeout(() => {
				localPlayer.removeTile(offset.y == 1 ? 2 : 0)
				setTimeout(() => {
					localPlayer.walk(offset.y == 1 ? 2 : 0)
				}, framesPerSecond / 16 * 650)
			}, (1 / 16) * framesPerSecond * 100)
		} else {
			localPlayer.walk(offset.y == 1 ? 2 : 0)
			setTimeout(() => {
				localPlayer.removeTile(offset.x == 1 ? 1 : 3)
				setTimeout(() => {
					localPlayer.walk(offset.x == 1 ? 1 : 3)
				}, framesPerSecond / 16 * 650)
			}, (1 / 16) * framesPerSecond * 100)
		}
	}


	let foundDirection = false
	for (let i = 0; i < 4; i++) {
		let pos = localPlayer.getPosInWalkDirection(i)
		if (getTileBufferValue(pos) == id) {
			localPlayer.removeTile(i)
			setTimeout(() => {
				localPlayer.walk(i)
				autoMine(id)
			}, (1 / 16) * framesPerSecond * 650)
			foundDirection = true
			break
		}
	}

	if (!foundDirection) {
		console.log('trying diagonals')
		for (let i = 0; i < 4; i++) {
			let tempPos = localPlayer.pos.copy()
			tempPos.add(diagonals[i])
			let tile = getTileBufferValue(tempPos)
			if (tile == id) {
				setTimeout(() => {
                    mineDiagonal(i)
                    autoMine(id)
                }, (1 / 16) * framesPerSecond * 100)
			}
		}
	}
}

// automatically create a tunnel
function createTunnel(forward, createBlocks = true) {
    let clockwise = betterModulus(forward + 1, 4)
    let counterclockwise = betterModulus(forward - 1, 4)
    
    function tileIsEmpty(tileId) {
        return tileId === emptyTile || (tileId >= trailStartTile && tileId < trailStartTile + trailTileAmount)
    }
    
    function placeTileIfEmpty(direction) {
        let tempPos = localPlayer.getPosInWalkDirection(direction);
        let tempTile = getTileBufferValue(tempPos);
        
        if (tileIsEmpty(tempTile)) {
            localPlayer.placeTile(direction)
        }
    }
    
    if (createBlocks) {
        placeTileIfEmpty(clockwise)
        placeTileIfEmpty(counterclockwise)
    }

    let tempPos = localPlayer.getPosInWalkDirection(forward);
    let tempTile = getTileBufferValue(tempPos);

    if (!tileIsEmpty(tempTile))
        localPlayer.removeTile(forward)

    setTimeout(() => {
        localPlayer.walk(forward)
        setTimeout(() => {
            createTunnel(forward, clockwise, counterclockwise, createBlocks)
        }, (1 / 16) * framesPerSecond * 600)
    }, tileIsEmpty(tempTile) ? 0 : (1 / 16) * framesPerSecond * 600)
}
