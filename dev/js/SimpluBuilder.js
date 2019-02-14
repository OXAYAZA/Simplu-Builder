'use strict';

// Прототип окна отладки
function SimpluDebug() {
	this.container  = window.builder.container;
	this.createDebug();
	window.debug = this.message.bind( this );
	return this;
}

SimpluDebug.prototype.createDebug = function() {
	this.item = document.createElement( 'pre' );
	this.item.className = 'simplu-debug';
	this.container.appendChild( this.item );
};

SimpluDebug.prototype.message = function( data ) {
	var processed;
	try {
		processed = JSON.stringify( data, null, 2 );
	} catch ( error ) {
		processed = '[BAD DATA]';
	}
	this.item.innerText = processed;
};


// Прототип плагина
function SimpluPlugin( params ) {
	this.params = Util.merge([ this.defaults, params ]);
	this.params.node.plugin = this;

	if ( this.params.init instanceof Function ) {
		this.params.init = this.params.init.bind( this );
		this.params.init();
	}

	if ( this.params.final instanceof Function ) {
		this.params.final = this.params.final.bind( this );
	}
}

SimpluPlugin.prototype.defaults = {
	node: null,
	name: 'Noname Plugin',
	allow: {
		copy: false,
		delete: false,
		move: false
	},
	init: null,
	final: null
};


// Прототип фрейма
function SimpluFrame( params ) {
	// Внутренние параметры
	this.container  = window.builder.container;
	this.page       = window.builder.page;
	this.buffered   = null;
	this.target     = null;
	this.freeSelect = true; // TODO должен зависить от режима билдера или переключаться как параметр в настройках
	this.mode       = 'default'; // default|move
	this.color = {
		default: [ '#109df7', 'white' ],
		warning: [ '#f7e74b', 'black' ],
		good:    [ '#7df7ac', 'white' ]
	};

	this.createFrame();
	this.assignHandlers();

	return this;
}

SimpluFrame.prototype.setColorCheme = function( name ) {
	this.frame.style.setProperty( '--simplu-primary', this.color[ name ][ 0 ] );
	this.frame.style.setProperty( '--simplu-secondary', this.color[ name ][ 1 ] );
};

SimpluFrame.prototype.genSelector = function( element ) {
	var string = element.tagName.toLowerCase();
	Array.from( element.classList ).forEach( function( item ) { string += '.'+ item; });
	return string;
};

SimpluFrame.prototype.createFrame = function() {
	this.frame = document.createElement( 'div' );
	this.frame.className = 'simplu-frame';
	this.frame.innerHTML = '<div class="simplu-panel"><div class="simplu-title"></div><button class="simplu-button simplu-move fa-arrows" title="move"></button><button class="simplu-button simplu-copy fa-copy" title="copy"></button><button class="simplu-button simplu-delete fa-trash-o" title="delete"></button></div>';
	this.panel = this.frame.querySelector( '.simplu-panel' );
	this.title = this.frame.querySelector( '.simplu-title' );
	this.btnMove = this.frame.querySelector( '.simplu-move' );
	this.btnCopy = this.frame.querySelector( '.simplu-copy' );
	this.btnDel = this.frame.querySelector( '.simplu-delete' );
	this.setColorCheme( 'default' );
	this.container.appendChild( this.frame );
};

SimpluFrame.prototype.assignHandlers = function() {
	window.addEventListener( 'load', (function() {
		document.addEventListener( 'mousemove', this.mouse.bind( this ) );
		document.addEventListener( 'scroll', this.scroll.bind( this ) );
		this.btnCopy.addEventListener( 'click', this.copy.bind( this ) );
		this.btnDel.addEventListener( 'click', this.delete.bind( this ) );
		this.btnMove.addEventListener( 'mousedown', this.startMove.bind( this ) );
		document.addEventListener( 'mouseup', this.endMove.bind( this ) );
	}).bind( this ));
};

SimpluFrame.prototype.update = function( node, event ) {
	var free = event && event.ctrlKey && this.freeSelect;
	if ( node && this.target !== node ) {
		if ( free ) this.target = node;
		else if ( node.plugin ) this.target = node;
	}

	// Скрывать рамку если Сtrl был отпущен в режиме default
	if( event && !event.ctrlKey && this.target && !this.target.plugin && this.mode === 'default' ) {
		this.hide();
	}

	if ( this.target ) {
		if ( this.target.plugin ) console.log( '[SimpluFrame] target plugin:', this.target.plugin.params.name );
		else console.log( '[SimpluFrame] target node:', this.target );

		// В случае скролла страницы сброс transiton для отсутствия плавания рамки
		if ( event && event.type === 'scroll' ) {
			clearTimeout( this.noTransitionId );
			this.frame.style.transition = 'top .0s, left .0s, width .0s, height .0s';

			this.noTransitionId = setTimeout( (function () {
				this.frame.style.transition = 'top .15s, left .15s, width .15s, height .15s';
			}).bind( this ), 200 );
		} else {
			this.frame.style.transition = 'top .15s, left .15s, width .15s, height .15s';
		}

		// Отображение и перемещение рамки
		var targetRect = this.target.getBoundingClientRect();
		this.frame.style.display = 'block';
		this.frame.style.top = targetRect.y + 'px';
		this.frame.style.left = targetRect.x + 'px';
		this.frame.style.width = targetRect.width + 'px';
		this.frame.style.height = targetRect.height + 'px';

		if ( this.mode === 'default' ) {
			// Заголовок и цветовая схема
			if ( this.target.plugin ) {
				this.setColorCheme( 'default' );
				this.title.innerHTML = this.target.plugin.params.name;
			} else {
				this.setColorCheme( 'warning' );
				this.title.innerHTML = this.genSelector( this.target );
			}

			// Кнопка перемещения
			if ( ( this.target.plugin && this.target.plugin.params.allow.move ) || free ) {
				this.btnMove.style.display = 'block';
			} else {
				this.btnMove.style.display = 'none';
			}

			// Кнопка копирования
			if ( ( this.target.plugin && this.target.plugin.params.allow.copy ) || free ) {
				this.btnCopy.style.display = 'block';
			} else {
				this.btnCopy.style.display = 'none';
			}

			// Кнопка удления
			if ( ( this.target.plugin && this.target.plugin.params.allow.delete ) || free ) {
				this.btnDel.style.display = 'block';
			} else {
				this.btnDel.style.display = 'none';
			}
		}

		if ( this.mode === 'move' ) {
			this.panel.style.top = event.clientY +'px';
			this.panel.style.left = event.clientX +'px';

			// Цветовая схема
			if ( this.target.plugin ) this.setColorCheme( 'default' );
			else this.setColorCheme( 'warning' );

			// Заголовок
			if ( this.buffered.plugin ) this.title.innerHTML = this.buffered.plugin.params.name;
			else this.title.innerHTML = this.genSelector( this.buffered );
			
			// Кнопки
			this.btnMove.style.display = 'none';
			this.btnCopy.style.display = 'none';
			this.btnDel.style.display = 'none';
		}
	}
};

SimpluFrame.prototype.hide = function() {
	console.log( '[SimpluFrame] hide' );
	this.target = null;
	this.frame.style.display = 'none';
};

SimpluFrame.prototype.mouse = function( event ) {
	if ( this.page.contains( event.target ) ) {
		debug( this.genSelector( event.target ) );
		this.update( event.target, event );
	}
};

SimpluFrame.prototype.scroll = function( event ) {
	this.update( null, event );
};

SimpluFrame.prototype.startMove = function( event ) {
	if ( event.which === 1 ) {
		this.buffered = this.target;
		if ( this.buffered.plugin ) console.log( '[SimpluFrame] start move:', this.buffered.plugin.params.name );
		else console.log( '[SimpluFrame] start move:', this.genSelector( this.buffered ) );
		this.mode = 'move';
		this.panel.style.position = 'fixed';
		this.panel.style.transform = 'translate(-50%, -50%)';
		this.panel.style.bottom = 'auto';
		this.panel.style.right = 'auto';
		this.panel.style.pointerEvents = 'none';

		// Костыль, чтоб панель рамки не дергалась пр переходе в режим move
		setTimeout( (function() {
			this.panel.style.transition = 'top .15s, left .15s';
		}).bind( this ), 1 );

		this.update( null, event );
	}
};

SimpluFrame.prototype.endMove = function( event ) {
	if ( event.which === 1 && this.target && this.buffered ) {
		if ( this.buffered.plugin ) console.log( '[SimpluFrame] end move:', this.buffered.plugin.params.name );
		else console.log( '[SimpluFrame] end move:', this.genSelector( this.buffered ) );
		this.mode = 'default';
		this.panel.style.position = 'absolute';
		this.panel.style.transform = 'translate(-50%, 0)';
		this.panel.style.top = 'auto';
		this.panel.style.bottom = '100%';
		this.panel.style.left = '50%';
		this.panel.style.right = 'auto';
		this.panel.style.pointerEvents = 'auto';
		this.panel.style.transition = 'none';

		if ( event.target.plugin || ( event.ctrlKey && this.freeSelect && event.target ) ) {
			if ( event.target.plugin ) console.log( '[SimpluFrame] moved before:', event.target.plugin );
			else console.log( '[SimpluFrame] moved before:', this.genSelector( event.target ) );
			this.target.parentElement.insertBefore( this.buffered, event.target );
		}

		this.update( this.buffered, event );
		this.buffered = null;
	}
};

SimpluFrame.prototype.copy = function() {
	if ( this.target.plugin ) console.log( '[SimpluFrame] copy:', this.target.plugin.params.name );
	else console.log( '[SimpluFrame] copy:', this.genSelector( this.target ) );

	var
		parent = this.target.parentNode,
		next = this.target.nextSibling,
		clone = this.target.cloneNode( true );

	if ( next ) parent.insertBefore( clone, next );
	else parent.appendChild( clone );

	this.update();
};

SimpluFrame.prototype.delete = function() {
	if ( this.target.plugin ) console.log( '[SimpluFrame] delete:', this.target.plugin.params.name );
	else console.log( '[SimpluFrame] delete:', this.genSelector( this.target ) );

	var
		next = this.target.nextElementSibling,
		prev = this.target.previousElementSibling;

	this.target.remove();

	if ( next ) this.update( next );
	else if ( prev ) this.update( prev );
	else this.hide();
};


// Прототип Билдера
function SimpluBuilder( options ) {
	window.builder = this;
	var $this = this;

	this.container = document.documentElement;
	this.page = document.querySelector( '#page' ); // TODO получать из параметра/настроек билдера/значения по умолчанию
	this.mode = 'basic'; // TODO режимы live/basic/advanced
	this.frame = new SimpluFrame();
	this.debug = new SimpluDebug();
	this.plugins = {};

	// https://developer.mozilla.org/ru/docs/Web/API/MutationObserver
	// TODO BUG: нет реакции при копировании/удалении узла с вложенными компонентами, нужен метод перебора вложенных елементов
	this.observer = new MutationObserver( function( mutations ) {
		mutations.forEach( function( mutation ) {
			if ( mutation.type === 'childList' ) {
				if ( mutation.addedNodes ) mutation.addedNodes.forEach( function( item ) {
					if ( item instanceof Element ) {
						if ( item.hasAttribute( 'data-plugin' ) ) {
							var name = item.getAttribute( 'data-plugin' );
							console.log( '[SimpluBuilder] adding plugin:', name );
							new SimpluPlugin( Util.merge([ $this.plugins[ name ], { node: item } ]) );
						} else {
							console.log( '[SimpluBuilder] added:', item.constructor.name );
						}
					}
				});

				if ( mutation.removedNodes ) mutation.removedNodes.forEach( function( item ) {
					if ( item instanceof Element ) {
						if ( item.hasAttribute( 'data-plugin' ) ) {
							var name = item.getAttribute( 'data-plugin' );
							console.log( '[SimpluBuilder] removing plugin:', name );
							// TODO BUG: ошибка при удалении не проинициализированного компонента, есть атрибут data-plugin но у елемента нет ключа params
							if ( item.plugin.params.final instanceof Function ) item.plugin.params.final();
						} else {
							console.log( '[SimpluBuilder] removed:', item.constructor.name );
						}
					}
				});
			}
		});
	});
}

SimpluBuilder.prototype.deploy = function() {
	console.log( '[SimpluBuilder] deploy' );
	var $this = this;

	// Запуск обозревателя
	this.observer.observe( this.page, { childList: true, subtree: true } );

	// Первичная инициализация компонентов
	for ( var key in this.plugins ) {
		var selection = Array.from( document.querySelectorAll( '[data-plugin='+ key +']' ) );
		selection.forEach( function( node ) {
			new SimpluPlugin( Util.merge([ $this.plugins[ key ], { node: node } ]) );
		});
	}
};

SimpluBuilder.prototype.registerPlugin = function( params ) {
	this.plugins[ params.name ] = params;
};
