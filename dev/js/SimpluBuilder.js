'use strict';

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
	init: null,
	final: null
};


// Прототип фрейма
function SimpluFrame() {
	this.container = document.documentElement;
	this.page = document.querySelector( '#page' ); // TODO получать из параметра + значение по умолчанию
	this.target = null;

	this.init();

	window.addEventListener( 'load', (function() {
		document.addEventListener( 'scroll', this.scroll.bind( this ) );
		document.addEventListener( 'mousemove', this.mouse.bind( this ) );
		this.btnCopy.addEventListener( 'click', this.copy.bind( this ) );
		this.btnDel.addEventListener( 'click', this.delete.bind( this ) );
	}).bind( this ));

	return this;
}

SimpluFrame.prototype.init = function() {
	this.frame = document.createElement( 'div' );
	this.frame.className = 'simplu-frame';
	this.frame.innerHTML = '<div class="simplu-panel"><div class="simplu-title"></div><button class="simplu-button simplu-copy fa-copy" title="copy"></button><button class="simplu-button simplu-delete fa-trash-o" title="delete"></button></div>';
	this.title = this.frame.querySelector( '.simplu-title' );
	this.btnCopy = this.frame.querySelector( '.simplu-copy' );
	this.btnDel = this.frame.querySelector( '.simplu-delete' );
	this.container.appendChild( this.frame );
	window.builder = this;
};

SimpluFrame.prototype.update = function( node, event ) {
	if ( node && this.target !== node ) {
		this.target = node;
		console.log( '[SimpluFrame] target:', this.target.plugin.params.name );
	}

	if ( this.target ) {
		var
			rect = this.target.getBoundingClientRect(),
			noTransitionId;

		clearTimeout( noTransitionId );
		this.frame.style.display = 'block';
		this.frame.style.transition = 'top .15s, left .15s, width .15s, height .15s';
		this.frame.style.top = rect.y +'px';
		this.frame.style.left = rect.x +'px';
		this.frame.style.width = rect.width +'px';
		this.frame.style.height = rect.height +'px';

		if ( event && event.type === 'scroll' ) {
			this.frame.style.transition = 'top .0s, left .0s, width .0s, height .0s';

			noTransitionId = setTimeout( (function() {
				this.frame.style.transition = 'top .15s, left .15s, width .15s, height .15s';
			}).bind( this ), 200 );
		}

		if ( this.target.plugin ) this.title.innerHTML = this.target.plugin.params.name;
		else this.title.innerHTML = 'Bad'; // TODO Определять тэг, метод определения компонента, тэга или селектора
	}
};

SimpluFrame.prototype.mouse = function( event ) {
	if ( this.page.contains( event.target ) && event.target.plugin ) {
		this.update( event.target, event );
	}
};

SimpluFrame.prototype.scroll = function( event ) {
	this.update( null, event );
};

SimpluFrame.prototype.copy = function() {
	console.log( '[SimpluFrame] copy:', this.target.plugin.params.name );

	var
		parent = this.target.parentNode,
		next = this.target.nextSibling,
		clone = this.target.cloneNode( true );

	if ( next ) parent.insertBefore( clone, next );
	else parent.appendChild( clone );

	this.update( this.target );
};

SimpluFrame.prototype.delete = function() {
	console.log( '[SimpluFrame] delete:', this.target.plugin.params.name );

	var
		next = this.target.nextElementSibling,
		prev = this.target.previousElementSibling;

	this.target.remove();

	if ( next ) this.update( next );
	else if ( prev ) this.update( prev );
	else this.update( null );
};


// Прототип Билдера
function SimpluBuilder( options ) {
	var $this = this;
	this.page = document.querySelector( '#page' ); // TODO получать из параметра + значение по умолчанию
	this.frame = new SimpluFrame();
	this.plugins = {};

	// https://developer.mozilla.org/ru/docs/Web/API/MutationObserver
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
							console.log( '[SimpluBuilder] added:', item );
						}
					}
				});

				if ( mutation.removedNodes ) mutation.removedNodes.forEach( function( item ) {
					if ( item instanceof Element ) {
						if ( item.hasAttribute( 'data-plugin' ) ) {
							var name = item.getAttribute( 'data-plugin' );
							console.log( '[SimpluBuilder] removing plugin:', name );
							if ( item.plugin.params.final instanceof Function ) item.plugin.params.final();
						} else {
							console.log( '[SimpluBuilder] removed:', item );
						}
					}
				});
			}
		});
	});
}

SimpluBuilder.prototype.deploy = function() {
	console.log( '[SimpluBuilder] deploy' );
	console.log( this.plugins );
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
