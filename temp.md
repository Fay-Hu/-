<!DOCTYPE html>
<html>
	<head>
		<meta charset="UTF-8">
		<title></title>
		<style>
			.demo{
				background: red;
				height: 200px;
				width: 200px;
			}
		</style>
	</head>
	<body>
		<div class="demo" draggable="true" ondragstart="onDragStart(event)"></div>
		<script>
			function onDragStart(e){
				e.dataTransfer.setDragImage(document.createElement('div'),0,0);
			}
		</script>
	</body>
</html>
