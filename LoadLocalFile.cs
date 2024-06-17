using System;
using System.IO;
using UnityEngine;
using UnityEngine.Android;
using Vuplex.WebView;

public class LoadLocalFile : MonoBehaviour
{
    CanvasWebViewPrefab _webViewPrefab;

    void Awake()
    {
        // CanvasWebViewPrefab 컴포넌트 가져오기
        _webViewPrefab = GetComponent<CanvasWebViewPrefab>();
        if (_webViewPrefab == null)
        {
            Debug.LogError("CanvasWebViewPrefab component not found");
        }
    }

    async void Start()
    {
        if (_webViewPrefab == null)
        {
            Debug.LogError("CanvasWebViewPrefab component was not found in Awake");
            return;
        }

        try
        {
            // 위치 권한 요청
            RequestLocationPermission();

            // WebView 초기화 대기
            await _webViewPrefab.WaitUntilInitialized();
            Debug.Log("WebView initialized");

            // 콘솔 메시지 로그 설정
            _webViewPrefab.WebView.ConsoleMessageLogged += (sender, e) => {
                Debug.Log($"Console message: {e.Message}");
            };

            // 로컬 파일 경로 설정 및 로드
            string localFilePath = Path.Combine(Application.streamingAssetsPath, "index.html");
            _webViewPrefab.WebView.LoadUrl($"file://{localFilePath}");
            Debug.Log($"Local File loaded from path: file://{localFilePath}");

            // 위치 정보 가져오기 및 JS로 전달
            StartCoroutine(UpdateLocation());
        }
        catch (Exception e)
        {
            Debug.LogError($"Exception in Start method: {e.Message}\n{e.StackTrace}");
        }
    }

    void RequestLocationPermission()
    {
#if UNITY_ANDROID
        if (!Permission.HasUserAuthorizedPermission(Permission.FineLocation))
        {
            Permission.RequestUserPermission(Permission.FineLocation);
        }
#elif UNITY_IOS
        // iOS에서는 자동으로 권한 요청이 이루어짐
#endif
    }

    System.Collections.IEnumerator UpdateLocation()
    {
#if UNITY_EDITOR
        // Unity 에디터에서는 모의 위치 정보 사용
        while (true)
        {
            var latitude = 37.455110065813365;
            var longitude = 127.13331699371379;
            Debug.Log("Mock Location: " + latitude + " " + longitude);

            // JS로 위치 정보 전달
            string jsCode = $"updateLocation({latitude}, {longitude});";
            _webViewPrefab.WebView.ExecuteJavaScript(jsCode);

            yield return new WaitForSeconds(5); // 5초마다 업데이트
        }
#else
        // 위치 서비스가 활성화되었는지 확인
        if (!Input.location.isEnabledByUser)
        {
            Debug.LogError("Location services are not enabled by the user");
            yield break;
        }

        // 위치 서비스 시작
        Input.location.Start();

        // 위치 서비스 초기화 대기 (최대 20초 대기)
        int maxWait = 20;
        while (Input.location.status == LocationServiceStatus.Initializing && maxWait > 0)
        {
            yield return new WaitForSeconds(1);
            maxWait--;
        }
        // 위치 서비스 초기화 실패
        if (maxWait < 1)
        {
            Debug.LogError("Timed out waiting for location services to initialize");
            yield break;
        }

        // 위치 서비스 사용 불가
        if (Input.location.status == LocationServiceStatus.Failed)
        {
            Debug.LogError("Unable to determine device location");
            yield break;
        }

        // 주기적으로 위치 정보 업데이트
        while (true)
        {
            if (Input.location.status == LocationServiceStatus.Running)
            {
                var latitude = Input.location.lastData.latitude;
                var longitude = Input.location.lastData.longitude;
                Debug.Log("Location: " + latitude + " " + longitude);

                // JS로 위치 정보 전달
                string jsCode = $"updateLocation({latitude}, {longitude});";
                _webViewPrefab.WebView.ExecuteJavaScript(jsCode);
            }
            yield return new WaitForSeconds(5); // 5초마다 업데이트
        }
#endif
    }
}
