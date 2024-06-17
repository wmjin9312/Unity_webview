function searchPoiInfo(resultpoisData){
  var resultDiv = document.getElementById("markerPoiSearch");
  resultDiv.innerHTML = "";
  
  for (var i = 0; i < resultpoisData.length - 1; i++) {
      var item = resultpoisData[i];
      var p = document.createElement("p");
      p.textContent = (i + 1) + '. ' + item.name;
      resultDiv.appendChild(p);
  }
}


function searchStartData(){
  var searchKeyword = $('#startInput').val();
  if (searchKeyword === '') {
    return; // 검색어가 비어있으면 함수 실행 중지
  }

  var headers = {};
  headers["appKey"] = "RaT1JNAxgE8o362lZNH1j3HDGwsWCVAY2UXvvMV7";

  $.ajax({
    method:"GET",
    headers : headers,
    url:"https://apis.openapi.sk.com/tmap/pois?version=1&format=json&callback=result",
    async:false,
    data:{
      "searchKeyword" : searchKeyword,
      "resCoordType" : "EPSG3857",
      "reqCoordType" : "WGS84GEO",
      "count" : 10
    },
    success:function(response){
      var resultpoisData = response.searchPoiInfo.pois.poi;
      searchPoiInfo(resultpoisData)

      // 기존 마커, 팝업 제거
      if(markerArr.length > 0){
        for(var i in markerArr){
          markerArr[i].setMap(null);
        }
      }
      var innerHtml ="";	// Search Reulsts 결과값 노출 위한 변수
      var positionBounds = new Tmapv2.LatLngBounds();		//맵에 결과물 확인 하기 위한 LatLngBounds객체 생성


      // 검색 결과 처리
      for (var k = 0; k < resultpoisData.length - 1; k++){
        var noorLat = Number(resultpoisData[k].noorLat);
        var noorLon = Number(resultpoisData[k].noorLon);
        var name = resultpoisData[k].name;

        var pointCng = new Tmapv2.Point(noorLon, noorLat);
        var projectionCng = new Tmapv2.Projection.convertEPSG3857ToWGS84GEO(pointCng);

        var lat = projectionCng._lat;
        var lon = projectionCng._lng;

        var markerPosition = new Tmapv2.LatLng(lat, lon);

        // 마커 생성 및 지도에 추가
        k = parseInt(k);
        marker = new Tmapv2.Marker({
          position : markerPosition,
          //icon : "/upload/tmap/marker/pin_b_m_a.png",
          icon: "http://tmapapi.sktelecom.com/upload/tmap/marker/pin_b_m_" + (k+1) + ".png",
          iconSize : new Tmapv2.Size(24, 38),
          title : name,
          map : map
        });
        
        innerHtml += "<li><img src='/upload/tmap/marker/pin_b_m_" + (k+1) + ".png' style='vertical-align:middle;'/><span>"+name+"</span></li>";
        
        markerArr.push(marker);
        positionBounds.extend(markerPosition);	// LatLngBounds의 객체 확장
      }

      $("#searchResult").html(innerHtml);	//searchResult 결과값 노출
      map.panToBounds(positionBounds);	// 확장된 bounds의 중심으로 이동시키기
      map.zoomOut();
      
    },
    error:function(request,status,error){
      console.log("code:"+request.status+"\n"+"message:"+request.responseText+"\n"+"error:"+error);
    }
  });
};