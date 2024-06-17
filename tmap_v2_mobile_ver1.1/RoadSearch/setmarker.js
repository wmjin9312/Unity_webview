function setMarker(mapLatLng, type) {
  
  var markerPosition = new Tmapv2.LatLng(mapLatLng._lat, mapLatLng._lng);
  console.log(mapLatLng)

  if (type === "start") {
    if (marker_s) marker_s.setMap(null);
    marker_s = new Tmapv2.Marker({
      position: markerPosition,
      icon: "/upload/tmap/marker/pin_b_m_a.png",
      iconSize: new Tmapv2.Size(24, 38),
      map: map
    });
    reverseGeo(mapLatLng._lng, mapLatLng._lat, type);
    document.getElementById("startInput").value = mapLatLng._lat + ", " + mapLatLng._lng;
  } else if (type === "end") {
    if (marker_e) marker_e.setMap(null);
    marker_e = new Tmapv2.Marker({
      position: markerPosition,
      icon: "/upload/tmap/marker/pin_b_m_b.png",
      iconSize: new Tmapv2.Size(24, 38),
      map: map
    });
    reverseGeo(mapLatLng._lng, mapLatLng._lat, type);
    document.getElementById("endInput").value = mapLatLng._lat + ", " + mapLatLng._lng;
  }
}