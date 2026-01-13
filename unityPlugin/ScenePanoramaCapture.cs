using UnityEngine;
using System.IO;

/// <summary>
/// Unity 6 場景全景捕捉器
/// 直接在場景中捕捉 360° 全景圖（不依賴材質球）
/// </summary>
public class ScenePanoramaCapture : MonoBehaviour
{
    [Header("捕捉設定")]
    [Tooltip("按此鍵捕捉全景圖")]
    public KeyCode captureKey = KeyCode.Space;
    
    [Tooltip("全景圖寬度")]
    public int panoramaWidth = 4096;
    
    [Tooltip("全景圖高度")]
    public int panoramaHeight = 2048;
    
    [Tooltip("輸出資料夾")]
    public string outputFolder = "ScenePanoramas";
    
    [Header("場景設定")]
    [Tooltip("要使用的 Skybox 材質（可選，留空使用場景預設）")]
    public Material skyboxMaterial;
    
    private Camera captureCamera;
    private int captureCount = 0;

    void Start()
    {
        // 如果沒有相機，自動創建一個
        captureCamera = GetComponent<Camera>();
        if (captureCamera == null)
        {
            captureCamera = gameObject.AddComponent<Camera>();
        }

        // 設定相機
        captureCamera.fieldOfView = 90;
        captureCamera.nearClipPlane = 0.1f;
        captureCamera.farClipPlane = 1000f;

        // 確保輸出資料夾存在
        string fullPath = Path.Combine(Application.dataPath, outputFolder);
        if (!Directory.Exists(fullPath))
        {
            Directory.CreateDirectory(fullPath);
        }

        Debug.Log("=== 場景全景捕捉器已就緒 ===");
        Debug.Log($"按 {captureKey} 鍵捕捉全景圖");
        Debug.Log($"輸出位置: Assets/{outputFolder}/");
    }

    void Update()
    {
        if (Input.GetKeyDown(captureKey))
        {
            CapturePanorama();
        }
    }

    [ContextMenu("立即捕捉全景圖")]
    public void CapturePanorama()
    {
        Debug.Log("=== 開始捕捉全景圖 ===");

        // 如果指定了 Skybox 材質，臨時套用
        Material originalSkybox = RenderSettings.skybox;
        if (skyboxMaterial != null)
        {
            RenderSettings.skybox = skyboxMaterial;
            DynamicGI.UpdateEnvironment();
            Debug.Log($"使用指定的 Skybox: {skyboxMaterial.name}");
        }

        // 1. 創建 Cubemap RenderTexture
        RenderTexture cubemapRT = new RenderTexture(2048, 2048, 24);
        cubemapRT.dimension = UnityEngine.Rendering.TextureDimension.Cube;
        cubemapRT.Create();

        // 2. 渲染到 Cubemap
        captureCamera.RenderToCubemap(cubemapRT);
        Debug.Log("✓ Cubemap 渲染完成");

        // 3. 轉換為等距柱狀投影
        RenderTexture equirect = new RenderTexture(panoramaWidth, panoramaHeight, 24);
        equirect.Create();

        cubemapRT.ConvertToEquirect(equirect, Camera.MonoOrStereoscopicEye.Mono);
        Debug.Log("✓ 轉換為等距柱狀投影完成");

        // 4. 讀取像素並保存
        RenderTexture.active = equirect;
        Texture2D texture = new Texture2D(panoramaWidth, panoramaHeight, TextureFormat.RGB24, false);
        texture.ReadPixels(new Rect(0, 0, panoramaWidth, panoramaHeight), 0, 0);
        texture.Apply();

        // 5. 保存為 PNG
        byte[] bytes = texture.EncodeToPNG();
        string timestamp = System.DateTime.Now.ToString("yyyyMMdd_HHmmss");
        string materialName = skyboxMaterial != null ? skyboxMaterial.name : "Scene";
        string filename = $"{materialName}_panorama_{captureCount:D3}_{timestamp}.png";
        string fullPath = Path.Combine(Application.dataPath, outputFolder, filename);
        File.WriteAllBytes(fullPath, bytes);

        Debug.Log($"✓ 全景圖已保存: {fullPath}");
        Debug.Log($"✓ 解析度: {panoramaWidth} × {panoramaHeight}");
        Debug.Log($"✓ 相機位置: {transform.position}");
        
        captureCount++;

        // 6. 清理
        RenderTexture.active = null;
        Destroy(texture);
        cubemapRT.Release();
        equirect.Release();

        // 恢復原始 Skybox
        if (skyboxMaterial != null && originalSkybox != null)
        {
            RenderSettings.skybox = originalSkybox;
            DynamicGI.UpdateEnvironment();
        }

        Debug.Log("=== 捕捉完成 ===");
        
#if UNITY_EDITOR
        UnityEditor.AssetDatabase.Refresh();
        Debug.Log("提示: 請到 Project 視窗的 Assets/" + outputFolder + "/ 資料夾查看");
#endif
    }

    // 快速設定方法
    [ContextMenu("設定為 Room1 Skybox")]
    void SetRoom1Skybox()
    {
        Material room1 = UnityEditor.AssetDatabase.LoadAssetAtPath<Material>("Assets/Room1.mat");
        if (room1 != null)
        {
            skyboxMaterial = room1;
            Debug.Log("✓ 已設定為 Room1");
        }
        else
        {
            Debug.LogWarning("找不到 Room1.mat");
        }
    }

    [ContextMenu("設定為 Room2 Skybox")]
    void SetRoom2Skybox()
    {
        Material room2 = UnityEditor.AssetDatabase.LoadAssetAtPath<Material>("Assets/Room2.mat");
        if (room2 != null)
        {
            skyboxMaterial = room2;
            Debug.Log("✓ 已設定為 Room2");
        }
        else
        {
            Debug.LogWarning("找不到 Room2.mat");
        }
    }
}
