function resetData() {
  // 마커와 폴리라인을 제거하는 공통 함수
  const clearMapElements = (elements) => {
    elements.forEach(element => {
      if (element) {
        element.setMap(null);
      }
    });
  };

  // 단일 마커와 마커 배열 처리
  clearMapElements([marker_s, marker_e, ...markerArr, ...markerPoints, ...polylines]);
  marker_s = null;
  marker_e = null;
  markerArr = [];
  markerPoints = [];
  polylines = [];

  // polyline_ 처리
  if (polyline_) {
    polyline_.setMap(null);
    polyline_ = null;
  }

  // 입력 필드와 결과 영역 초기화
  ["startInput", "endInput"].forEach(id => {
    const inputElement = document.getElementById(id);
    if (inputElement) {
      inputElement.value = ''; // 입력 필드를 비웁니다
    }
  });

  ["startAddress", "endAddress", "descriptionResult", "result", "markerPoiSearch"].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = '';
    }
  });

  // clickCount 초기화
  clickCount = 0;
}
