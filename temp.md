<!DOCTYPE html>
<html>

	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width">
		<title>JS Bin</title>
		<style type="text/css">
			.box {}
			
			.wrap {
				display: inline-block;
			}
			
			.item {
				height: 40px;
				width: 70px;
				margin: 10px;
				background: red;
				display: inline-block;
				vertical-align: top;
			}
		</style>
	</head>

	<body>
		<button class="clear">清空</button><button class="recover">恢复</button>
		<div class="area">
			<div class="box">
				<div class="item">1</div>
				<div class="wrap">
					<div class="box">
						<div class=item>2</div>
						<div class="wrap">
							<div class="box">
								<div class="item">3</div>
								<div class="wrap"></div>
							</div>
						</div>
					</div>
					<div class="box">
						<div class="item">4</div>
						<div class="wrap"></div>
					</div>
				</div>
			</div>
		</div>
		<script src="https://code.jquery.com/jquery-1.11.3.js"></script>
		<script type="text/javascript">
			var TEMPLATE = '<div class="box"><div class="item">${text}</div><div class="wrap"></div></div>';

			var getData = function() {
				var _getChild = function($node) {
					return $.map($node.children('.box'), function(v, i) {
						return {
							text: $('>.item', v).text(),
							children: _getChild($(v).children('.wrap'))
						};
					});
				};
				return _getChild($('.area'))[0];
			};

			var recover = function(data) {
				var _renderChild = function(data, $ele) {
					$.each(data.children, function(i, v) {
						var $temp = $(TEMPLATE.replace(/\$\{text\}/, v.text));

						$ele.find('.wrap').append($temp);
						_renderChild(v, $temp)
					});
				};
				
				var $temp = $(TEMPLATE.replace(/\$\{text\}/, data.text));
				_renderChild(data, $temp)
				$('.area').append($temp);
			};
			var data = getData($('.area'));
			console.log(JSON.stringify(data))
			$(document).on('click', '.clear', function() {
					$('.area').empty();
				})
				.on('click', '.recover', function() {
					recover(data);
				});
		</script>
	</body>

</html>
