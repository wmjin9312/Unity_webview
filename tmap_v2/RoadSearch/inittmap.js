var map, marker, descriptions = []; // 전역 변수로 정의

// 페이지 로드시 initTmap 실행
window.onload = function initTmap() {
  initializeRemoteControl();
  document.getElementById('startInput').value = "37.455110065813365, 127.13331699371379";
  document.getElementById('endInput').value = "37.45051933068758, 127.1274483203892";

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onCurrentPositionSuccess, onCurrentPositionError);
  } else {
    console.log("Geolocation is not supported by this browser.");
  }
};

function onCurrentPositionSuccess(position) {
  var lat = position.coords.latitude;
  var lon = position.coords.longitude;
  console.log("현재 위치는 ", "위도 :", lat, "경도 :", lon, " 입니다");

  initializeMap(lat, lon);
  initializeMarker(lat, lon);

  map.addListener("click", onMapClick);
  map.addListener("touchstart", onMapTouchStart);

  initializeRemoteControl(marker);
  watchPositionAndUpdateDescription();
}

function onCurrentPositionError(error) {
  console.log("Error: " + error.message);
}

function initializeMap(lat, lon) {
  map = new Tmapv2.Map("map_div", {
    center: new Tmapv2.LatLng(lat, lon),
    width: "100%",
    height: "400px",
    zoom: 17,
    zoomControl: true,
    scrollwheel: true,
    httpsMode:true,
  });
}

function initializeMarker(lat, lon) {
  marker = new Tmapv2.Marker({
    position: new Tmapv2.LatLng(lat, lon),
    map: map
  });
}

function onMapClick(evt) {
  handleMapEvent(evt.latLng);
}

function onMapTouchStart(evt) {
  var touch = evt.changedTouches[0];
  var touchLatLng = map.getProjection().fromPointToLatLng(new Tmapv2.Point(touch.clientX, touch.clientY));
  handleMapEvent(touchLatLng);
}

function handleMapEvent(latLng) {
  clickCount++;
  if (clickCount === 1) {
    setMarker(latLng, "start");
  } else if (clickCount === 2) {
    setMarker(latLng, "end");
  }
}

function initializeRemoteControl(marker) {
  var remoteControl = document.getElementById('remoteControl');
  var centerButton = document.getElementById('centerButton');
  var dragging = false;
  var startX, startY, startLat, startLon;

  centerButton.addEventListener('mousedown', function(e) {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    var center = map.getCenter(); // Tmap 제공 메소드
    startLat = center.lat();
    startLon = center.lng();
  });

  document.addEventListener('mousemove', function(e) {
    if (dragging) {
      var newCenter = calculateNewCenter(e, startX, startY, startLat, startLon);
      map.setCenter(newCenter);
      if (marker) {
        marker.setPosition(newCenter);
      }
      console.log("새 위치는 ", "위도 :", newCenter.lat(), "경도 :", newCenter.lng(), " 입니다");

      checkNearbyDescriptions(newCenter.lat(), newCenter.lng());
    }
  });

  document.addEventListener('mouseup', function() {
    dragging = false;
  });
}

function calculateNewCenter(e, startX, startY, startLat, startLon) {
  var deltaX = e.clientX - startX;
  var deltaY = e.clientY - startY;
  var newLat = startLat + (deltaY * 0.00001); 
  var newLon = startLon + (deltaX * 0.00001);
  return new Tmapv2.LatLng(newLat, newLon);
}

// geolocation watcher 함수
function watchPositionAndUpdateDescription() {
  navigator.geolocation.watchPosition(onGeolocationUpdate, onGeolocationError, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 27000
  });
}

function onGeolocationUpdate(position) {
  var lat = position.coords.latitude;
  var lon = position.coords.longitude;

  if (marker) {
    marker.setPosition(new Tmapv2.LatLng(lat, lon));
  }
  console.log("현재 위치는 ", "위도 :", lat, "경도 :", lon, " 입니다");

  // Check for nearby descriptions
  checkNearbyDescriptions(lat, lon);
}

function onGeolocationError(error) {
  console.log("Error: " + error.message);
}

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
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // 지구의 반지름 (km)
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

    // 원격 조작 초기화
    initializeRemoteControl(marker);
  } else {
    // 기존 지도 업데이트
    var newCenter = new Tmapv2.LatLng(lat, lon);
    map.setCenter(newCenter);
    if (marker) {
      marker.setPosition(newCenter);
    }
  }

  checkNearbyDescriptions(lat, lon);
}
