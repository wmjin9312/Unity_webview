// 이동 구간의 description을 완성형 문장으로 변형
function parseLegModeDesc(descriptions, leg, stationList) {
  if (stationList.length === 0) return
  var routeName = leg.route
  var startStationName = stationList[0].stationName
  var endStationName = stationList[stationList.length - 1].stationName
  if (['SUBWAY', 'BUS', 'TRAIN'].includes(leg.mode)) {
    descriptions.push(`${routeName}의 ${startStationName}역에서 탑승`);
    descriptions.push(`${routeName}의 ${endStationName}역에서 하차`);
  } else if (leg.mode === 'EXPRESSBUS') {
    descriptions.push(`${routeName}편을 ${startStationName}터미널에서 탑승`);
    descriptions.push(`${routeName}편을 ${endStationName}터미널에서 하차`);
  } else if (leg.mode === 'AIRPLANE') {
    descriptions.push(`${routeName}편을 ${startStationName}공항에서 탑승`);
    descriptions.push(`${routeName}편을 ${endStationName}공항에서 하차`);
  }
}

// description의 문법을 변경하여 완성형 문장으로 변형
function formatDescription(description) {
  description = description.replace(/ 을 따라/g, '를 따라');
  description = description.replace(/ 에서/g, '에서');
  description = description.replace(/횡단보도 후 /g, ' 횡단보도를 건너 ');
  return description;
}

// '합니다' 추가 및 p 태그 삽입
function writeDesc(descriptions, travelMode) {
  const resultDiv = document.getElementById("descriptionResult");
  resultDiv.innerHTML = "";

  const appendDescription = (description, addSuffix = true) => {
    const p = document.createElement("p");
    p.textContent = description + (addSuffix ? "합니다" : "");
    resultDiv.appendChild(p);
  };

  if (travelMode === 'publicTransport') {
    descriptions.forEach(description => appendDescription(description));
  } else if (travelMode === 'walk') {
    descriptions.forEach(descriptionObj => appendDescription(descriptionObj.description));
  }

  appendDescription("목적지에 도착했습니다", false);
}

// description의 공백 제거
function trimDesc(descriptions) {
  return descriptions.map((desc, index) => {
    if (index === 0) return desc; // 첫 번째 요소는 그대로 둠
    return desc.trimEnd(); // trimEnd 함수를 사용하여 마지막 공백 제거
  });
}

// 웹 페이지에 총 거리, 총 시간 출력
function parseResult(totalDistance, totalTime) {
  var tDistance = "총 거리 : " + (totalDistance / 1000).toFixed(1) + "km,";
  var tTime = " 총 시간 : " + (totalTime / 60).toFixed(0) + "분";
  $("#result").text(tDistance + tTime);
}

// 기존에 있던 마커 제거
function deleteExistMarker() {
  if (!Array.isArray(markerArr)) {
    console.error('markerArr is not an array');
    return;
  }
  markerArr.forEach(marker => {
    try {
      marker.setMap(null);
    } catch (error) {
      console.error('Error in deleting marker:', error);
    }
  });
}

// element 초기화
function clearElement(element) {
  element.innerHTML = "";
}

// 서버에서 response로 result 를 줄 경우
function displayServerMessage(response) {
  if (response && response.result) {
    const message = response.result.message;
    const resultDiv = document.getElementById("descriptionResult");
    clearElement(resultDiv);

    const messageParagraph = document.createElement("p");
    messageParagraph.textContent = message;
    resultDiv.appendChild(messageParagraph);
  }
}

// EPSG3857 좌표를 WGS84 좌표로 변환
function convertEPSG3857ToWGS84([x, y]) {
  var lon = (x / 20037508.34) * 180;
  var lat = (y / 20037508.34) * 180;
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
  return [lat, lon];
}

// 마커 포인트 업데이트 함수
function pointMarker(resultData, drawInfoArr, markerPoints, descriptions) {
  var pointsGeo = [];

  for (var i in resultData) {
    var geometry = resultData[i].geometry;
    var properties = resultData[i].properties;

    if (geometry.type == "LineString") {
      for (var j in geometry.coordinates) {
        // 경로들의 결과값(구간)들을 포인트 객체로 변환
        var latlng = new Tmapv2.Point(
          geometry.coordinates[j][0],
          geometry.coordinates[j][1]
        );
        // 포인트 객체를 받아 좌표값으로 변환
        var convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
          latlng
        );
        // 포인트객체의 정보로 좌표값 변환 객체로 저장
        var convertChange = new Tmapv2.LatLng(
          convertPoint._lat,
          convertPoint._lng
        );
        // 배열에 담기
        drawInfoArr.push(convertChange);
      }
    } else {
      var markerImg = "";
      var pType = "";
      var size;

      if (properties.pointType == "S") { // 출발지 마커
        markerImg = "/upload/tmap/marker/pin_r_m_s.png";
        pType = "S";
        size = new Tmapv2.Size(24, 38);
      } else if (properties.pointType == "E") { // 도착지 마커
        markerImg = "/upload/tmap/marker/pin_r_m_e.png";
        pType = "E";
        size = new Tmapv2.Size(24, 38);
      } else { // 각 포인트 마커
        markerImg = "http://topopen.tmap.co.kr/imgs/point.png";
        pType = "P";
        size = new Tmapv2.Size(8, 8);
      }

      // 경로들의 결과값들을 포인트 객체로 변환
      var latlon = new Tmapv2.Point(
        geometry.coordinates[0],
        geometry.coordinates[1]
      );

      // 포인트 객체를 받아 좌표값으로 다시 변환
      var convertPoint = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(
        latlon
      );

      var routeInfoObj = {
        markerImage: markerImg,
        lng: convertPoint._lng,
        lat: convertPoint._lat,
        pointType: pType
      };

      // Marker 추가
      var marker_p = new Tmapv2.Marker({
        position: new Tmapv2.LatLng(routeInfoObj.lat, routeInfoObj.lng),
        icon: routeInfoObj.markerImage,
        iconSize: size,
        map: map
      });

      markerPoints.push(marker_p);

      // 좌표값을 geo 리스트에 담기
      pointsGeo.push([routeInfoObj.lat, routeInfoObj.lng]);

      // descriptions에 추가
      if (properties.description) {
        descriptions.push({
          description: properties.description,
          coordinates: convertEPSG3857ToWGS84([geometry.coordinates[0], geometry.coordinates[1]])
        });
      }
    }
  }
  console.log(pointsGeo, descriptions);
}

async function postData() {
  var startCoords = document.getElementById("startInput").value.split(", ");
  var endCoords = document.getElementById("endInput").value.split(", ");
  var travelModeSelect = document.getElementById("travelMode");
  var travelMode = travelModeSelect.value;
  var drawInfoArr = [];
  var headers = {};
  headers["appKey"] = "RaT1JNAxgE8o362lZNH1j3HDGwsWCVAY2UXvvMV7";

  if (travelMode === "publicTransport") {
    $.ajax({
      method: "POST",
      headers: headers,
      url: "https://apis.openapi.sk.com/transit/routes",
      async: true,
      data: JSON.stringify({
        "startX": startCoords[1],
        "startY": startCoords[0],
        "endX": endCoords[1],
        "endY": endCoords[0],
        "count": 1,
        "lang": 0,
        "format": "json"
      }),
      success: function (response) {
        deleteExistMarker();
        displayServerMessage(response);

        var itineraries = response.metaData.plan.itineraries;
        var itinerary = itineraries[0] || [];
        var legs = itinerary.legs || [];
        legs.forEach(leg => {
          var linestring = '';
          var routeColor = '';
          if (leg.mode === 'WALK') {
            if (leg.passShape) {
              linestring = leg.passShape.linestring;
            } else if (leg.steps) {
              linestring = leg.steps.map(step => step.linestring).join(' ');
              descriptions = descriptions.concat(leg.steps.map(step => step.description));
            } else {
              var startLon = leg.start.lon;
              var startLat = leg.start.lat;
              var endLon = leg.end.lon;
              var endLat = leg.end.lat;
              linestring = `${startLon},${startLat} ${endLon},${endLat}`;
            }
            descriptions = trimDesc(descriptions);
          } else if (['BUS', 'SUBWAY', 'TRAIN', 'AIRPLANE', 'EXPRESSBUS'].includes(leg.mode)) {
            if (leg.mode === 'BUS' || leg.mode === 'SUBWAY' || leg.mode === 'TRAIN' || leg.mode === 'AIRPLANE' || leg.mode === 'EXPRESSBUS') {
              routeColor = leg.routeColor;
            }
            if (leg.passShape) linestring = leg.passShape.linestring;
            if (leg.passStopList) {
              var stationList = leg.passStopList.stationList || [];
              parseLegModeDesc(descriptions, leg, stationList);
              parseResult(itineraries[0].totalDistance, itineraries[0].totalTime);
            }
            descriptions = trimDesc(descriptions);
          }
          descriptions = descriptions.map(description => formatDescription(description));
          writeDesc(descriptions, travelMode);

          if (linestring) {
            var points = linestring.split(' ').map(coordPair => {
              var coords = coordPair.split(',');
              return new Tmapv2.LatLng(coords[1], coords[0]);
            });
          }
          drawLine(points, leg.mode, routeColor);
        });
      },
      error: function (request, status, error) {
        console.error("API call failed", { request, status, error });
      }
    });
  } else if (travelMode === "walk") {
    $.ajax({
      method: "POST",
      headers: headers,
      url: "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&format=json&callback=result",
      async: true,
      data: {
        "startX": startCoords[1],
        "startY": startCoords[0],
        "endX": endCoords[1],
        "endY": endCoords[0],
        "reqCoordType": "WGS84GEO",
        "resCoordType": "EPSG3857",
        "startName": "출발지",
        "endName": "도착지"
      },

      success: function (response) {
        deleteExistMarker();
        var resultData = response.features;
        descriptions = resultData
          .map((feature, index) => {
            if (feature.geometry.type === 'Point') {
              let description = feature.properties.description.trimEnd();
              description = formatDescription(description);
              return {
                index: index,
                description: description,
                coordinates: convertEPSG3857ToWGS84(feature.geometry.coordinates)
              };
            }
            return null;
          })
          .filter(item => item !== null);

        descriptions.pop();
        writeDesc(descriptions, travelMode);
        parseResult(resultData[0].properties.totalDistance, resultData[0].properties.totalTime);
        pointMarker(resultData, drawInfoArr, markerPoints, descriptions);
        drawLine(drawInfoArr);
      },
      error: function (jqXHR, textStatus, errorThrown) {
        console.log("Error Status: " + textStatus);
        console.log("Error Thrown: " + errorThrown);
        console.log("Response Text: " + jqXHR.responseText);

        var response = JSON.parse(jqXHR.responseText);
        console.log("Parsed Error Message: " + response.error.message);

        var resultDiv = document.getElementById("descriptionResult");
        resultDiv.innerHTML = ""; // 이전 내용 초기화
        var p = document.createElement("p");
        p.textContent = response.error.message;
        resultDiv.appendChild(p);
      }
    });
  }

  var resultDiv = document.getElementById("markerPoiSearch");
  resultDiv.innerHTML = "";
}