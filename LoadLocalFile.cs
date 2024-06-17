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
        // CanvasWebViewPrefab ������Ʈ ��������
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
            // ��ġ ���� ��û
            RequestLocationPermission();

            // WebView �ʱ�ȭ ���
            await _webViewPrefab.WaitUntilInitialized();
            Debug.Log("WebView initialized");

            // �ܼ� �޽��� �α� ����
            _webViewPrefab.WebView.ConsoleMessageLogged += (sender, e) => {
                Debug.Log($"Console message: {e.Message}");
            };

            // ���� ���� ��� ���� �� �ε�
            string localFilePath = Path.Combine(Application.streamingAssetsPath, "index.html");
            _webViewPrefab.WebView.LoadUrl($"file://{localFilePath}");
            Debug.Log($"Local File loaded from path: file://{localFilePath}");

            // ��ġ ���� �������� �� JS�� ����
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
        // iOS������ �ڵ����� ���� ��û�� �̷����
#endif
    }

    System.Collections.IEnumerator UpdateLocation()
    {
#if UNITY_EDITOR
        // Unity �����Ϳ����� ���� ��ġ ���� ���
        while (true)
        {
            var latitude = 37.455110065813365;
            var longitude = 127.13331699371379;
            Debug.Log("Mock Location: " + latitude + " " + longitude);

            // JS�� ��ġ ���� ����
            string jsCode = $"updateLocation({latitude}, {longitude});";
            _webViewPrefab.WebView.ExecuteJavaScript(jsCode);

            yield return new WaitForSeconds(5); // 5�ʸ��� ������Ʈ
        }
#else
        // ��ġ ���񽺰� Ȱ��ȭ�Ǿ����� Ȯ��
        if (!Input.location.isEnabledByUser)
        {
            Debug.LogError("Location services are not enabled by the user");
            yield break;
        }

        // ��ġ ���� ����
        Input.location.Start();

        // ��ġ ���� �ʱ�ȭ ��� (�ִ� 20�� ���)
        int maxWait = 20;
        while (Input.location.status == LocationServiceStatus.Initializing && maxWait > 0)
        {
            yield return new WaitForSeconds(1);
            maxWait--;
        }
        // ��ġ ���� �ʱ�ȭ ����
        if (maxWait < 1)
        {
            Debug.LogError("Timed out waiting for location services to initialize");
            yield break;
        }

        // ��ġ ���� ��� �Ұ�
        if (Input.location.status == LocationServiceStatus.Failed)
        {
            Debug.LogError("Unable to determine device location");
            yield break;
        }

        // �ֱ������� ��ġ ���� ������Ʈ
        while (true)
        {
            if (Input.location.status == LocationServiceStatus.Running)
            {
                var latitude = Input.location.lastData.latitude;
                var longitude = Input.location.lastData.longitude;
                Debug.Log("Location: " + latitude + " " + longitude);

                // JS�� ��ġ ���� ����
                string jsCode = $"updateLocation({latitude}, {longitude});";
                _webViewPrefab.WebView.ExecuteJavaScript(jsCode);
            }
            yield return new WaitForSeconds(5); // 5�ʸ��� ������Ʈ
        }
#endif
    }
}
