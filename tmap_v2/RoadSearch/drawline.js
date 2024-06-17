function drawLine(arrPoint, legMode, routeColor) {
  var strokeColor;
  var strokeStyle;
  var formattedRouteColor = routeColor ? "#" + routeColor : null;

  switch (legMode) {
    case 'WALK':
      strokeColor = "#000000"; // 도보 구간의 폴리라인 색상
      strokeStyle = 'dot'
      break;
    case 'SUBWAY':
    case 'BUS':
    case 'TRAIN':
    case 'EXPRESSBUS':
    case 'AIRPLANE':
      strokeColor = formattedRouteColor || "#00FF00"; // 버스 구간의 폴리라인 색상
      break;
    default:
      strokeColor = "#DD0000"; // 기본 색상 (도보 모드)
  }

  var polyline = new Tmapv2.Polyline({
    path: arrPoint,
    strokeColor: strokeColor,
    strokeStyle : strokeStyle,
    strokeWeight: 6,
    map: map
  });
  polylines.push(polyline);
}
