var map, marker, descriptions = []; // 전역 변수로 정의
var startTouchLatLng = null; // 터치 시작 위치 저장
var clickCount = 0; // 클릭 수 저장
var path = []; // 경로를 저장할 배열
var locationUpdateInterval = 3000; // 위치 업데이트 간격 (3초)
var trackingInterval; // 트래킹 인터벌 저장 변수

window.onload = function initTmap() {
  document.getElementById('startInput').value = "37.455110065813365, 127.13331699371379";
  document.getElementById('endInput').value = "37.45051933068758, 127.1274483203892";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onCurrentPositionSuccess, onCurrentPositionError);
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
};

//현재 위치 잘 받아올 시, map 그리는 함수
function onCurrentPositionSuccess(position) {
  var lat = position.coords.latitude;
  var lon = position.coords.longitude;
  console.log("현재 위치는 ", "위도 :", lat, "경도 :", lon, " 입니다");

  initializeMap(lat, lon);
  initializeMarker(lat, lon);

  map.addListener("click", onMapClick);
  map.addListener("touchstart", onMapTouchStart);
  map.addListener("touchmove", onMapTouchMove);
  map.addListener("touchend", onMapTouchEnd);
}

function onCurrentPositionError(error) {
  console.log("Error: " + error.message);
}

//map 그리는 함수
function initializeMap(lat, lon) {
  map = new Tmapv2.Map("map_div", {
    center: new Tmapv2.LatLng(lat, lon),
    width: "100%",
    height: "100%",
    zoom: 18,
    zoomControl: true,
    scrollwheel: true,
    httpsMode: true,
  });
}

//map에 marker 찍는 함수
function initializeMarker(lat, lon) {
  marker = new Tmapv2.Marker({
    position: new Tmapv2.LatLng(lat, lon),
    map: map
  });
}

//map 클릭 이벤트 함수 등록
function onMapClick(evt) {
  handleMapEvent(evt.latLng);
}

//map 터치 이벤트 함수 등록
function onMapTouchStart(evt) {
  var touch = evt.changedTouches[0];
  startTouchLatLng = map.getProjection().fromPointToLatLng(new Tmapv2.Point(touch.clientX, touch.clientY));
}

//map 드래그 이벤트 함수 등록
function onMapTouchMove(evt) {
  if (!startTouchLatLng) return;

  var touch = evt.changedTouches[0];
  var currentLatLng = map.getProjection().fromPointToLatLng(new Tmapv2.Point(touch.clientX, touch.clientY));
  var newCenter = new Tmapv2.LatLng(
    map.getCenter()._lat + (startTouchLatLng._lat - currentLatLng._lat),
    map.getCenter()._lng + (startTouchLatLng._lng - currentLatLng._lng)
  );
  map.setCenter(newCenter);
  startTouchLatLng = currentLatLng;
}


function onMapTouchEnd(evt) {
  map.zoomOut();
  startTouchLatLng = null;
}

function handleMapEvent(latLng) {
  clickCount++;
  if (clickCount === 1) {
    setMarker(latLng, "start");
  } else if (clickCount === 2) {
    setMarker(latLng, "end");
    clickCount = 0;
  }
}

// map 가운데로 자동 업데이트
function calculateNewCenter(e, startX, startY, startLat, startLon) {
  var deltaX = e.clientX - startX;
  var deltaY = e.clientY - startY;
  var newLat = startLat + (deltaY * 0.00001);
  var newLon = startLon + (deltaX * 0.00001);
  return new Tmapv2.LatLng(newLat, newLon);
}

// 현재 위치 값 업데이트
function onGeolocationUpdate(position) {
  var lat = position.coords.latitude;
  var lon = position.coords.longitude;

  if (marker) {
    marker.setPosition(new Tmapv2.LatLng(lat, lon));
  }
  console.log("현재 위치는 ", "위도 :", lat, "경도 :", lon, " 입니다");

  // 경로에 현재 위치 추가
  if (trackingInterval) {
    tracker(lat, lon);
  }

  // Check for nearby descriptions
  checkNearbyDescriptions(lat, lon);
}

function onGeolocationError(error) {
  console.log("Error: " + error.message);
}

//포인트 가까운 설명문 출력
function checkNearbyDescriptions(lat, lon) {
  if (!descriptions || descriptions.length === 0) return;

  // 가까운 위치에 대한 설명 필터링
  var nearbyDescriptions = descriptions.filter(desc => {
    var distance = getDistanceFromLatLonInKm(lat, lon, desc.coordinates[0], desc.coordinates[1]);
    return distance < 0.005; // 반경 5m 이내
  });

  // 인덱스가 있는 설명만 필터링
  var indexedDescriptions = nearbyDescriptions.filter(desc => desc.hasOwnProperty('index'));

  // testStart div 요소 선택
  var testStartDiv = document.getElementById('testStart');
  testStartDiv.innerHTML = ""; // 초기화

  if (indexedDescriptions.length > 0) {
    var descriptionsHtml = "가까운 위치에 대한 설명:<br>";
    indexedDescriptions.forEach(desc => {
      descriptionsHtml += desc.description + "합니다<br>";
    });
    testStartDiv.innerHTML = descriptionsHtml;
  } else {
    testStartDiv.innerHTML = "가까운 위치에 대한 설명이 없습니다.";
  }
}

// 두 지점 간 거리 계산 함수
//Haversine 공식
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) { 
  var R = 6371; 
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // 거리 (km)
  return d;
}

// 라디안 변환
function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Unity에서 위치 정보를 업데이트하는 함수
function updateLocation(lat, lon) {
  console.log("Received location from Unity: ", "위도 :", lat, "경도 :", lon);

  if (!map) {
    // 초기 지도 설정
    initializeMap(lat, lon);
    initializeMarker(lat, lon);

    // 지도의 클릭 이벤트 및 터치 이벤트 설정
    map.addListener("click", onMapClick);
    map.addListener("touchstart", onMapTouchStart);
    map.addListener("touchmove", onMapTouchMove);
    map.addListener("touchend", onMapTouchEnd);
  } else {
    // 기존 지도 업데이트
    var newCenter = new Tmapv2.LatLng(lat, lon);
    map.setCenter(newCenter);
    if (marker) {
      marker.setPosition(newCenter);
    }
  }

  // 트래커 업데이트는 트래킹 활성화 상태일 때만 수행
  if (trackingInterval) {
    tracker(lat, lon);
  }

  checkNearbyDescriptions(lat, lon);
}

// 트래커 함수
function tracker(currentLat, currentLon) {
  path.push(new Tmapv2.LatLng(currentLat, currentLon));
  console.log("현재 경로: ", path);

  if (path.length > 1) {
    var polyline = new Tmapv2.Polyline({
      path: path,
      strokeColor: "#dd00dd", // 라인 색상
      strokeWeight: 6, // 라인 두께
      map: map // 지도 객체
    });
  }
}

// Tracker 시작 버튼 함수
function startTracking() {
  if (!trackingInterval) {
    trackingInterval = setInterval(updateCurrentLocation, locationUpdateInterval);
    console.log("트래커 시작");
  }
}

// 3초마다 현재 위치 업데이트
function updateCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onGeolocationUpdate, onGeolocationError);
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
}
