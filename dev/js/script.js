"use strict";

var
	frame = document.querySelector( '#frame' ),
	btnCopy = document.querySelector( '#copy' ),
	btnDel = document.querySelector( '#delete' ),

	components = {},
	observer = new MutationObserver( function( mutations ) {
		mutations.forEach( function( mutation ) {
			if ( mutation.type === 'childList' ) {
				if ( mutation.addedNodes ) mutation.addedNodes.forEach( function( item ) {
					if ( item.hasAttribute( 'data-component' ) ) {
						var name = item.getAttribute( 'data-component' );
						console.log( 'added component:', name, item );
						new Component( Util.merge([ components[ name ], { node: item } ]) );
					} else {
						console.log( 'added:', item );
					}
				});

				if ( mutation.removedNodes ) mutation.removedNodes.forEach( function( item ) {
					if ( item.hasAttribute( 'data-component' ) ) {
						var name = item.getAttribute( 'data-component' );
						console.log( 'removed component:', name, item );
						item.component.params.final();
					} else {
						console.log( 'removed:', item );
					}
				});
			}
		});
	});

// Обновление фрейма
// TODO Прототип фрейма
function frameUpd( node ) {
	if ( frame.target !== node ) {
		frame.target = node;
		console.log( 'frame:', node );
	} else {
		var rect = node.getBoundingClientRect();
		frame.style.display = 'block';
		frame.style.top = (rect.y - 3) +'px';
		frame.style.left = (rect.x - 3) +'px';
		frame.style.width = (rect.width + 6) +'px';
		frame.style.height = (rect.height + 6) +'px';
		frame.querySelector( '.frame-panel .text' ).innerHTML = node.component.params.name;
	}
}

// Прототип компонента
function Component( params ) {
	this.params = Util.merge([ this.defaults, params ]);
	this.params.node.component = this;

	if ( this.params.init instanceof Function ) {
		this.params.init = this.params.init.bind( this );
		this.params.init();
	}

	if ( this.params.final instanceof Function ) {
		this.params.final = this.params.final.bind( this );
	}
}

Component.prototype.defaults = {
	node: null,
	name: 'Noname',
	init: null,
	final: null
};


// Регистрация компонентов
components[ 'Test' ] = {
	name: 'Test',
	init: function() {
		console.log( 'init component:', this.params.name, this.params.node );
	},
	final: function() {
		console.log( 'finalize component:', this.params.name, this.params.node );
	}
};


window.addEventListener( 'load', function() {
	console.log( 'window load' );

	// Обработка фрейма
	document.addEventListener( 'mousemove', function( event ) {
		if ( event.target.component ) frameUpd( event.target );
	});

	// Кнопка копирования
	btnCopy.addEventListener( 'click', function() {
		console.log( 'copy:', frame.target );
		frame.target.parentNode.insertBefore( frame.target.cloneNode( true ), frame.target );
		frameUpd( frame.target );
	});

	// Кнопка удаления
	btnDel.addEventListener( 'click', function() {
		console.log( 'delete:', frame.target );
		frame.target.remove();
	});
});


document.addEventListener( 'DOMContentLoaded', function() {
	// Первичная инициализация
	for ( var key in components ) {
		var selection = Array.from( document.querySelectorAll( '[data-component='+ key +']' ) );
		selection.forEach( function( node ) {
			new Component( Util.merge([ components[ key ], { node: node } ]) );
		});
	}

	// Основной обозреватель
	// https://developer.mozilla.org/ru/docs/Web/API/MutationObserver
	observer.observe( document.querySelector( '#page' ), { childList: true, subtree: true } );
});

/*
document.addEventListener( 'DOMContentLoaded', function() {
	var
		panel = document.querySelector('.widgets'),

		clickHandler = function() {
			console.log( 'click:', this );
			if ( this.classList.contains( 'active' ) ) {
				this.classList.remove( 'active' );
			} else {
				panel.widgets.forEach( function ( item ) { item.classList.remove( 'active' ); });
				this.classList.add( 'active' );
			}
		},

		widgetInit = function( item ) {
			if ( panel.widgets.indexOf( item ) === -1 ) {
				panel.widgets.push( item );
				item.addEventListener( 'click', clickHandler );
				console.log( 'init:', item, panel.widgets.indexOf( item ) );
			}
		},
					
		widgetFinal = function( item ) {
			
		},

		observer = new MutationObserver( function( mutations ) {
			mutations.forEach( function( mutation ) {
				if ( mutation.type === 'childList' ) {
					if ( mutation.addedNodes ) {
						mutation.addedNodes.forEach( function( item ) {
							console.log( 'added:', item );
							widgetInit( item );
						});
					}
					
					if ( mutation.removedNodes ) {
						mutation.removedNodes.forEach( function( item ) {
							console.log( 'removed:', item );
						});
					}
				}
			});
		});

	panel.widgets = [];
	observer.observe( panel, { childList: true } );

	panel.querySelectorAll('.widget').forEach( function ( item ) {
		widgetInit( item );
	});

	panel.querySelector('.add-button').addEventListener( 'click', function() {
		var node = document.createElement( 'div' );
		node.className = 'widget';
		panel.appendChild( node );
	});
});
*/
