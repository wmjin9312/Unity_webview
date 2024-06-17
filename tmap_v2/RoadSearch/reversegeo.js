function reverseGeo(lon, lat, type) {
  var headers = {};

  headers["appKey"]="RaT1JNAxgE8o362lZNH1j3HDGwsWCVAY2UXvvMV7";

  $.ajax({
    method : "GET",
    headers : headers,
    url : "https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&format=json&callback=result",
    async : false,
    data : {
      "coordType" : "WGS84GEO",
      "addressType" : "A10",
      "lon" : lon,
      "lat" : lat
    },
    success : function(response) {
      // 3. json에서 주소 파싱
      var arrResult = response.addressInfo;

      //법정동 마지막 문자
      var lastLegal = arrResult.legalDong
              .charAt(arrResult.legalDong.length - 1);

      // 새주소
      newRoadAddr = arrResult.city_do + ' '
              + arrResult.gu_gun + ' ';

      if (arrResult.eup_myun == ''
              && (lastLegal == "읍" || lastLegal == "면")) {//읍면
        newRoadAddr += arrResult.legalDong;
      } else {
        newRoadAddr += arrResult.eup_myun;
      }
      newRoadAddr += ' ' + arrResult.roadName + ' '
              + arrResult.buildingIndex;

      // 새주소 법정동& 건물명 체크
      if (arrResult.legalDong != ''
              && (lastLegal != "읍" && lastLegal != "면")) {//법정동과 읍면이 같은 경우

        if (arrResult.buildingName != '') {//빌딩명 존재하는 경우
          newRoadAddr += (' (' + arrResult.legalDong
                  + ', ' + arrResult.buildingName + ') ');
        } else {
          newRoadAddr += (' (' + arrResult.legalDong + ')');
        }
      } else if (arrResult.buildingName != '') {//빌딩명만 존재하는 경우
        newRoadAddr += (' (' + arrResult.buildingName + ') ');
      }

      // 구주소
      jibunAddr = arrResult.city_do + ' '
              + arrResult.gu_gun + ' '
              + arrResult.legalDong + ' ' + arrResult.ri
              + ' ' + arrResult.bunji;
      //구주소 빌딩명 존재
      if (arrResult.buildingName != '') {//빌딩명만 존재하는 경우
        jibunAddr += (' ' + arrResult.buildingName);
      }

      result = "주소 : " + newRoadAddr + "</br>";
      result += "위경도좌표 : " + lat + ", " + lon;

      if (type === "start") {
        document.getElementById("startInput").value = lat + ", " + lon;
        document.getElementById("startAddress").innerHTML = "주소 : " + newRoadAddr;
      } else if (type === "end") {
        document.getElementById("endInput").value = lat + ", " + lon;
        document.getElementById("endAddress").innerHTML = "주소 : " + newRoadAddr;
      }

    },
    error : function(request, status, error) {
      console.log("code:" + request.status + "\n"
              + "message:" + request.responseText + "\n"
              + "error:" + error);
    }
  });
}