using RockVR.Video;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using UnityEngine.XR.WSA.WebCam;

public class Webcam : MonoBehaviour {

	Renderer ren;

    public int SideMin = 0;
    public int SideMax = 7;

    public VideoCaptureCtrl CaptureControl;

    [HideInInspector]
    public WebCamTexture webcamTexture;

    public bool Replaying = false;

    public Image Recording;
    public Image Pause;

    private Color Clear = new Color(1, 1, 1, 0);
    private Color White = new Color(1, 1, 1, 1);

	void Start () {
        var quadHeight = Camera.main.orthographicSize * 2f;
        var quadWidth = quadHeight * Screen.width / Screen.height;
        transform.localScale = new Vector3(quadWidth, quadHeight, 1);

        webcamTexture = new WebCamTexture(1600, 869, 30);

        ren = GetComponent<Renderer>();        
        StartCam();

        
        if(Recording) UpdateColor(0);
        if(Pause) Pause.color = Clear;
	}
	
    public void StopCam() {
        webcamTexture.Stop();
    }

    public void StartCam() {
        ren.material.mainTexture = webcamTexture;
        webcamTexture.Play();		
    }

	public void NextSide() {
        var side = ren.material.GetInt("_Side");
        side++;

        if(side > SideMax) side = 0;

        ren.material.SetInt("_Side", side);
    }

	public void PreviousSide() {
        var side = ren.material.GetInt("_Side");
        side--;

        if(side < SideMin) side = SideMax;

        ren.material.SetInt("_Side", side);
    }

	void Update () {
		if(Input.GetKeyDown(KeyCode.RightArrow) || Input.GetAxis("Mouse ScrollWheel") > 0f) NextSide();
        if(Input.GetKeyDown(KeyCode.LeftArrow) || Input.GetAxis("Mouse ScrollWheel") < 0f) PreviousSide();

        if(CaptureControl.status == VideoCaptureCtrl.StatusType.FINISH && !Replaying) {
            Replaying = true;                        

            VideoPlayer.instance.enabled = true;
            VideoPlayer.instance.SetRootFolder();
            VideoPlayer.instance.PlayLastVideo();            
        }

        if(Input.GetKeyDown(KeyCode.Space)) {
            if(Replaying) {
                //Replaying = false;                                

                VideoPlayer.instance.StopVideo();
                CaptureControl.Refresh();                
                
                StopCam();

                CaptureControl.RemoveInstance();
                VideoPlayer.instance = null;
                SceneManager.LoadScene(0);
            } else {
                Record();
            }            
        }
	}

    public void Record() {
        if(CaptureControl.status == VideoCaptureCtrlBase.StatusType.STARTED) {
            CaptureControl.StopCapture(); 
            iTween.Stop();
            Recording.color = Clear;
        } else {
            CaptureControl.StartCapture();
            float flashSpeed = 0.5f;
            iTween.ValueTo(gameObject, iTween.Hash("from", 0f, "to", 1f, "time", flashSpeed, "easeType", iTween.EaseType.linear, "loopType", iTween.LoopType.pingPong, "onUpdate", "UpdateColor"));
        }


        
    }

    public void UpdateColor(float value) {
        Recording.color = new Color(White.r, White.g, White.b, value);
    }
}
