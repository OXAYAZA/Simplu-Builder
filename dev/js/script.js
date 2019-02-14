'use strict';

document.addEventListener( 'DOMContentLoaded', function() {
	// Инициализация билдера
	var builder = new SimpluBuilder();


	// Регистрация элементов с плагинами
	// Test plugin
	builder.registerPlugin({
		name: 'Test',
		allow: {
			copy: true,
			delete: true,
			move: true
		},
		init: function() {
			console.log( '[TestPlugin] init' );
		},
		final: function() {
			console.log( '[TestPlugin] finalize' );
		}
	});

	// Progress
	builder.registerPlugin({
		name: 'Progress',
		allow: {
			copy: true,
			delete: true,
			move: true
		},
		init: function() {
			console.log( '[Progress] init' );

			var
				node = this.params.node,
				progress = aProgressCircle({
					node: node.querySelector( '.progress-circle' )
				}),
				counter = aCounter({
					node: node.querySelector( '.progress-counter' ),
					duration: 1000
				}),
				countHandler = (function( event ) {
					this.render( event.value * -3.6 );
				}).bind( progress );

			counter.params.node.addEventListener( 'counterUpdate', countHandler );

			counter.params.to = parseInt( counter.params.node.textContent, 10 );
			counter.run();
		}
	});


	// Запуск билдера
	builder.deploy();
});
