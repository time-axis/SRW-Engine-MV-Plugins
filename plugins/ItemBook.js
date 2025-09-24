//=============================================================================
// ItemBook.js
//=============================================================================

/*:
 * @plugindesc Displays detailed statuses of items.
 * @author Yoji Ojima edited by TimeAxis
 *
 * @param Unknown Data
 * @desc The index name for an unknown item.
 * @default ??????
 *
 * @param Price Text
 * @desc The text for "Price".
 * @default Price
 *
 * @param Equip Text
 * @desc The text for "Equip".
 * @default Equip
 *
 * @param Type Text
 * @desc The text for "Type".
 * @default Type
 *
 * @help
 *
 * Plugin Command:
 *   ItemBook open            # Open the item book screen
 *   ItemBook add weapon 3    # Add weapon #3 to the item book
 *   ItemBook add armor 4     # Add armor #4 to the item book
 *   ItemBook remove armor 5  # Remove armor #5 from the item book
 *   ItemBook remove item 6   # Remove item #6 from the item book
 *   ItemBook complete        # Complete the item book
 *   ItemBook clear           # Clear the item book
 *
 * Item Note:
 *   <desc:Description>		  # You must use this for it to have a description. It will not use the default one.
 *   <img:Name>				  # This must be the name of an image in the pictures folder. No file extension
 * Item (Weapon, Armor) Note:
 *   <book:no>                # This item does not appear in the item book
 */

/*:ja
 * @plugindesc アイテム図鑑です。アイテムの詳細なステータスを表示します。
 * @author Yoji Ojima
 *
 * @param Unknown Data
 * @desc 未確認のアイテムの索引名です。
 * @default ？？？？？？
 *
 * @param Price Text
 * @desc 「価格」の文字列です。
 * @default 価格
 *
 * @param Equip Text
 * @desc 「装備」の文字列です。
 * @default 装備
 *
 * @param Type Text
 * @desc 「タイプ」の文字列です。
 * @default タイプ
 *
 * @help
 *
 * プラグインコマンド:
 *   ItemBook open            # 図鑑画面を開く
 *   ItemBook add weapon 3    # 武器３番を図鑑に追加
 *   ItemBook add armor 4     # 防具４番を図鑑に追加
 *   ItemBook remove armor 5  # 防具５番を図鑑から削除
 *   ItemBook remove item 6   # アイテム６番を図鑑から削除
 *   ItemBook complete        # 図鑑を完成させる
 *   ItemBook clear           # 図鑑をクリアする
 *
 * アイテム（武器、防具）のメモ:
 *   <book:no>                # 図鑑に載せない場合
 */

(function() {

    var parameters = PluginManager.parameters('ItemBook');
    var unknownData = String(parameters['Unknown Data'] || '??????');
    var priceText = String(parameters['Price Text'] || 'Price');
    var equipText = String(parameters['Equip Text'] || 'Equip');
    var typeText = String(parameters['Type Text'] || 'Type');

    var _Game_Interpreter_pluginCommand =
            Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        _Game_Interpreter_pluginCommand.call(this, command, args);
        if (command === 'ItemBook') {
            switch (args[0]) {
            case 'open':
				SceneManager.push(Scene_ItemBook);
				break;
            case 'add':
                $gameSystem.addToItemBook(args[1], Number(args[2]));
                break;
            case 'remove':
                $gameSystem.removeFromItemBook(args[1], Number(args[2]));
                break;
            case 'complete':
                $gameSystem.completeItemBook();
                break;
            case 'clear':
                $gameSystem.clearItemBook();
                break;
            }
        }
    };

    Game_System.prototype.addToItemBook = function(type, dataId) {
        if (!this._ItemBookFlags) {
            this.clearItemBook();
        }
        var typeIndex = this.itemBookTypeToIndex(type);
        if (typeIndex >= 0) {
            this._ItemBookFlags[typeIndex][dataId] = true;
        }
    };

    Game_System.prototype.removeFromItemBook = function(type, dataId) {
        if (this._ItemBookFlags) {
            var typeIndex = this.itemBookTypeToIndex(type);
            if (typeIndex >= 0) {
                this._ItemBookFlags[typeIndex][dataId] = false;
            }
        }
    };

    Game_System.prototype.itemBookTypeToIndex = function(type) {
        switch (type) {
        case 'item':
            return 0;
        case 'weapon':
            return 1;
        case 'armor':
            return 2;
        default:
            return -1;
        }
    };

    Game_System.prototype.completeItemBook = function() {
        var i;
        this.clearItemBook();
        for (i = 1; i < $dataItems.length; i++) {
            this._ItemBookFlags[0][i] = true;
        }
    };

    Game_System.prototype.clearItemBook = function() {
        this._ItemBookFlags = [[], [], []];
    };

    Game_System.prototype.isInItemBook = function(item) {
        if (this._ItemBookFlags && item) {
            var typeIndex = -1;
            if (DataManager.isItem(item)) {
                typeIndex = 0;
            } else if (DataManager.isWeapon(item)) {
                typeIndex = 1;
            } else if (DataManager.isArmor(item)) {
                typeIndex = 2;
            }
            if (typeIndex >= 0) {
                return !!this._ItemBookFlags[typeIndex][item.id];
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

    var _Game_Party_gainItem = Game_Party.prototype.gainItem;
    Game_Party.prototype.gainItem = function(item, amount, includeEquip) {
        _Game_Party_gainItem.call(this, item, amount, includeEquip);
        if (item && amount > 0) {
            var type;
            if (DataManager.isItem(item)) {
                type = 'item';
            }
            $gameSystem.addToItemBook(type, item.id);
        }
    };
	
    function Scene_ItemBook() {
        this.initialize.apply(this, arguments);
    }

    Scene_ItemBook.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_ItemBook.prototype.constructor = Scene_ItemBook;

    Scene_ItemBook.prototype.initialize = function() {
        Scene_MenuBase.prototype.initialize.call(this);
		this._iconsLoaded = false;
    };

    Scene_ItemBook.prototype.create = function() {
        Scene_MenuBase.prototype.create.call(this);
		
		// Start preloading the iconset
		this._iconBitmap = ImageManager.loadSystem('IconSet');
    };
	
	Scene_ItemBook.prototype.update = function() {
		Scene_MenuBase.prototype.update.call(this);

		if (!this._iconsLoaded && this._iconBitmap.isReady()) {
			this._iconsLoaded = true;
			
			this._indexWindow = new Window_ItemBookIndex(0, 0);
			this._indexWindow.setHandler('cancel', this.popScene.bind(this));
            this._indexWindow.setHandler('ok', this.onIndexOk.bind(this));
			
			var wy = this._indexWindow.height;
			var ww = Graphics.boxWidth;
			var wh = Graphics.boxHeight - wy;
			this._statusWindow = new Window_ItemBookStatus(0, wy, ww, wh);
            this._statusWindow.setHandler('cancel', this.onStatusCancel.bind(this));
		
			this.addWindow(this._indexWindow);
			this.addWindow(this._statusWindow);
			this._indexWindow.setStatusWindow(this._statusWindow);
		}
	};

    Scene_ItemBook.prototype.onIndexOk = function() {
        this._indexWindow.deactivate();
        this._statusWindow.select(0);
        this._statusWindow.activate();
    };

    Scene_ItemBook.prototype.onStatusCancel = function() {
        this._statusWindow.deselect();
        this._statusWindow.origin.y = 0;
        this._statusWindow.refresh();
        this._statusWindow.deactivate();
        this._indexWindow.activate();
    };

    function Window_ItemBookIndex() {
        this.initialize.apply(this, arguments);
    }

    Window_ItemBookIndex.prototype = Object.create(Window_Selectable.prototype);
    Window_ItemBookIndex.prototype.constructor = Window_ItemBookIndex;

    Window_ItemBookIndex.lastTopRow = 0;
    Window_ItemBookIndex.lastIndex  = 0;

    Window_ItemBookIndex.prototype.initialize = function(x, y) {
        var width = Graphics.boxWidth;
        var height = this.fittingHeight(3);
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
        this.refresh();
        this.setTopRow(Window_ItemBookIndex.lastTopRow);
        this.select(Window_ItemBookIndex.lastIndex);
        this.activate();
    };

    Window_ItemBookIndex.prototype.maxCols = function() {
        return 3;
    };

    Window_ItemBookIndex.prototype.maxItems = function() {
        return this._list ? this._list.length : 0;
    };

    Window_ItemBookIndex.prototype.setStatusWindow = function(statusWindow) {
        this._statusWindow = statusWindow;
        this.updateStatus();
    };

    Window_ItemBookIndex.prototype.update = function() {
        Window_Selectable.prototype.update.call(this);
        this.updateStatus();
    };

    Window_ItemBookIndex.prototype.updateStatus = function() {
        if (this._statusWindow) {
            var item = this._list[this.index()];
            this._statusWindow.setItem(item);
        }
    };

    Window_ItemBookIndex.prototype.refresh = function() {
        var i, item;
        this._list = [];
        for (i = 1; i < $dataItems.length; i++) {
            item = $dataItems[i];
            if (item.name && item.itypeId === 1 && item.meta.book !== 'no') {
                this._list.push(item);
            }
        }
        this.createContents();
        this.drawAllItems();
    };

    Window_ItemBookIndex.prototype.drawItem = function(index) {
        var item = this._list[index];
        var rect = this.itemRect(index);
        var width = rect.width - this.textPadding();
        if ($gameSystem.isInItemBook(item)) {
            this.drawItemName(item, rect.x, rect.y, width);
        } else {
            var iw = Window_Base._iconWidth + 4;
            this.drawText(unknownData, rect.x + iw, rect.y, width - iw);
        }
    };

    Window_ItemBookIndex.prototype.processCancel = function() {
        Window_Selectable.prototype.processCancel.call(this);
        Window_ItemBookIndex.lastTopRow = this.topRow();
        Window_ItemBookIndex.lastIndex = this.index();
    };

    function Window_ItemBookStatus() {
        this.initialize.apply(this, arguments);
    }

    Window_ItemBookStatus.prototype = Object.create(Window_Selectable.prototype);
    Window_ItemBookStatus.prototype.constructor = Window_ItemBookStatus;

    Window_ItemBookStatus.prototype.initialize = function(x, y, width, height) {
        Window_Selectable.prototype.initialize.call(this, x, y, width, height);
		this._imageLoading = false;
		this._currentImage = null;
        this._item = null;
        this._windowContentsSprite.width = this.innerWidth;
        this._windowContentsSprite.height = this.innerHeight;
    };
    
    Window_ItemBookStatus.prototype.updateArrows = function() {
        this.upArrowVisible = this.origin.y > 0;
        this.downArrowVisible = this.origin.y + this.innerHeight < this.contents.height;
    };

    Window_ItemBookStatus.prototype.updateCursor = function() {
        this.setCursorRect(0, 0, 0, 0);
    };

    Window_ItemBookStatus.prototype.maxItems = function() {
        return 1;
    };

    Window_ItemBookStatus.prototype.maxCols = function() {
        return 1;
    };

    Window_ItemBookStatus.prototype.processCursorMove = function() {
        if (this.isCursorMovable()) {
            var lastOrigin = this.origin.y;
            if (Input.isRepeated('down')) {
                this.scrollDown();
            }
            if (Input.isRepeated('up')) {
                this.scrollUp();
            }
            if (this.origin.y !== lastOrigin) {
                SoundManager.playCursor();
            }
        }
    };

    Window_ItemBookStatus.prototype.scrollDown = function() {
        this.origin.y += this.lineHeight();
        this.clampOrigin();
    };

    Window_ItemBookStatus.prototype.scrollUp = function() {
        this.origin.y -= this.lineHeight();
        this.clampOrigin();
    };

    Window_ItemBookStatus.prototype.clampOrigin = function() {
        var max = Math.max(0, this.contents.height - this.innerHeight);
        this.origin.y = Math.max(0, Math.min(this.origin.y, max));
        this.updateArrows();
    };

    Window_ItemBookStatus.prototype.setItem = function(item) {
        if (this._item !== item) {
            this._item = item;
            this.origin.y = 0;
			if(item && item.meta.img){ // Wait for image to load
				this.contents.clear();
				this._imageLoading = true;
				this._currentImage = ImageManager.loadPicture(item.meta.img);
			} else {
				this._currentImage = null;
				this.refresh();
			}
        }
    };
	
	Window_ItemBookStatus.prototype.update = function() {
        Window_Selectable.prototype.update.call(this);
		if(this._imageLoading){
			if(this._currentImage.isReady()){
				this._imageLoading = false;
				this.refresh();
			}
		}
        this._windowContentsSprite.setFrame(this.origin.x, this.origin.y, this.innerWidth, this.innerHeight);
        this.updateArrows();
	};
	
	Window_ItemBookStatus.prototype.calculateRequiredHeight = function(item) {
        if (!item) return this.innerHeight;
        var lineHeight = this.lineHeight();
        var textPadding = this.textPadding();
        var startY = lineHeight + textPadding;
        var leftX = textPadding;
        var fullWidth = this.innerWidth - leftX;
        var imgWidth = 0;
        var imgHeight = 0;
        if (item.meta.img && this._currentImage) {
            imgWidth = this._currentImage.width;
            imgHeight = this._currentImage.height;
        }
        var indentedX = leftX + imgWidth;
        var imgBottom = startY + imgHeight;
        var text = item.meta.desc ? this.convertEscapeCharacters(item.meta.desc) : '';
        var textHeight = this.calculateWrappedTextHeight(text, startY, imgBottom, leftX, indentedX, fullWidth);
        var contentBottom = startY + Math.max(textHeight, imgHeight);
        return contentBottom + textPadding;
    };

    Window_ItemBookStatus.prototype.calculateWrappedTextHeight = function(text, startY, imgBottom, leftX, indentedX, fullWidth) {
        var paragraphs = text.split('\n');
        var currentY = startY;
        paragraphs.forEach(function(paragraph) {
            var words = paragraph.split(' ');
            var currentLine = '';
            words.forEach(function(word) {
                var testLine = currentLine + word + ' ';
                var testWidth = this.textWidth(testLine);
                var currentMaxWidth = (currentY < imgBottom) ? this.innerWidth - indentedX : fullWidth;
                if (testWidth > currentMaxWidth) {
                    if (currentLine !== '') {
                        currentY += this.lineHeight();
                        currentLine = word + ' ';
                    } else {
                        currentY += this.lineHeight();
                        currentLine = '';
                    }
                } else {
                    currentLine = testLine;
                }
            }, this);
            if (currentLine !== '') {
                currentY += this.lineHeight();
            }
        }, this);
        return currentY - startY;
    };
	
	Window_ItemBookStatus.prototype.refresh = function() {
        var item = this._item;
        this.contents.clear();
        if (!item || !$gameSystem.isInItemBook(item)) {
            return;
        }
        var requiredHeight = this.calculateRequiredHeight(item);
        var contentHeight = Math.max(requiredHeight, this.innerHeight);
        if (this.contents.height !== contentHeight) {
            this.contents.resize(this.innerWidth, contentHeight);
            this.contents._baseTexture.width = this.contents.width;
            this.contents._baseTexture.height = this.contents.height;
            this.contents._setDirty();
            this._windowContentsSprite.texture.baseTexture.update();
        }
        this._windowContentsSprite.width = this.innerWidth;
        this._windowContentsSprite.height = this.innerHeight;
        var leftX = this.textPadding();
        var lineHeight = this.lineHeight();
        var startY = lineHeight + this.textPadding();      
        var imgWidth = 0;
        var imgHeight = 0;
        var indentedX = leftX;
        var imgBottom = startY;
        var fullWidth = this.contents.width - leftX;
        if (item.meta.img && this._currentImage) {
			imgWidth = this._currentImage.width * 1;
			imgHeight = this._currentImage.height * 1;
			indentedX = leftX + imgWidth;
			imgBottom = startY + imgHeight;
			// Draw the image at (x, y)
			this.contents.blt(this._currentImage, 0, 0, this._currentImage.width, this._currentImage.height, leftX, startY, imgWidth, imgHeight);
		}
        this.drawItemName(item, 0, 0);
		const text = (item.meta.desc ? this.convertEscapeCharacters(item.meta.desc) : '');
		this.drawWrappedText(text, indentedX, startY, imgBottom, leftX, fullWidth);
        this._windowContentsSprite.setFrame(this.origin.x, this.origin.y, this.innerWidth, this.innerHeight);
    };
	
	Window_ItemBookStatus.prototype.drawWrappedText = function(text, startX, startY, imgBottom, leftX, fullWidth) {
		var paragraphs = text.split('\n'); // Split text into paragraphs by explicit newlines
		var currentY = startY; // Start at the initial y-position
		
		paragraphs.forEach(function(paragraph) {
			var words = paragraph.split(' '); // Split paragraph into words
			var currentLine = ''; // Build the current line of text
			// Set initial x and width based on whether we're beside or below the image
			var currentX = (currentY < imgBottom) ? startX : leftX;
			var currentMaxWidth = (currentY < imgBottom) ? this.contents.width - startX : fullWidth;
			
			words.forEach(function(word) {
				var testLine = currentLine + word + ' '; // Test adding the word to the line
				var testWidth = this.textWidth(testLine); // Measure the width
				
				if (testWidth > currentMaxWidth) {
					// If the line exceeds the max width, draw it and start a new line
					if (currentLine !== '') {
						this.drawText(currentLine.trim(), currentX, currentY, currentMaxWidth);
						currentY += this.lineHeight(); // Move to the next line
						// Adjust x and width for the new line based on its y-position
						currentX = (currentY < imgBottom) ? startX : leftX;
						currentMaxWidth = (currentY < imgBottom) ? this.contents.width - startX : fullWidth;
						currentLine = word + ' '; // Start the new line with the current word
					} else {
						// If the word alone is too long, draw it and move to the next line
						this.drawText(word, currentX, currentY, currentMaxWidth);
						currentY += this.lineHeight();
						currentX = (currentY < imgBottom) ? startX : leftX;
						currentMaxWidth = (currentY < imgBottom) ? this.contents.width - startX : fullWidth;
						currentLine = '';
					}
				} else {
					currentLine = testLine; // Add the word to the current line
				}
			}, this);
			
			// Draw any remaining text in the paragraph
			if (currentLine !== '') {
				this.drawText(currentLine.trim(), currentX, currentY, currentMaxWidth);
				currentY += this.lineHeight(); // Move to the next line for the next paragraph
			}
		}, this);
	};

    Object.defineProperty(Window_ItemBookStatus.prototype, 'innerHeight', {
        get: function() {
            return this.height - this.standardPadding() * 2;
        },
        configurable: true
    });

    Object.defineProperty(Window_ItemBookStatus.prototype, 'innerWidth', {
        get: function() {
            return this.width - this.standardPadding() * 2;
        },
        configurable: true
    });

})();