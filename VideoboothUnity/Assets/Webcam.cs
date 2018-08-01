using RockVR.Video;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;
using UnityEngine.XR.WSA.WebCam;
using System.Runtime.InteropServices;
using System;

public class Webcam : MonoBehaviour {

    private const int APPCOMMAND_VOLUME_MUTE = 0x80000;
    private const int APPCOMMAND_VOLUME_UP = 0xA0000;
    private const int APPCOMMAND_VOLUME_DOWN = 0x90000;
    private const int WM_APPCOMMAND = 0x319;
 

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessageW(IntPtr hWnd, int Msg, IntPtr wParam, IntPtr lParam);

    public void MuteWindows() {
        var handle = GetWindowHandle();
        
        SendMessageW(handle, WM_APPCOMMAND, handle, (IntPtr)APPCOMMAND_VOLUME_MUTE);
    }

    [DllImport("user32.dll")]
    private static extern System.IntPtr GetActiveWindow();
 
    public static System.IntPtr GetWindowHandle() {
        return GetActiveWindow();
    }


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

    public string SavePath = "";

	private AudioSource microphone;

    public float RecordingTime = 30f;    

    private DateTime currentTime;
    private float currentTimeFloat;

    public Text TimeText;
    public GameObject Panel;

	void Start () {
        var quadHeight = Camera.main.orthographicSize * 2f;
        var quadWidth = quadHeight * Screen.width / Screen.height;
        transform.localScale = new Vector3(quadWidth, quadHeight, 1);

        webcamTexture = new WebCamTexture(1600, 869, 30);
        webcamTexture.hideFlags = HideFlags.HideAndDontSave;

        MuteWindows();

        currentTime = new DateTime(2018, 1, 1, 0, 0, 0, 0);
        currentTime = currentTime.AddSeconds(RecordingTime);
        currentTimeFloat = RecordingTime;
        TimeText.text = currentTime.ToString("mm:ss.ff");

		microphone = GetComponent<AudioSource> ();
		microphone.clip = Microphone.Start (null, true, 10, 44100);
		microphone.loop = true;

		//while (!(Microphone.GetPosition(null) > 0)){}

		microphone.Play ();
        ren = GetComponent<Renderer>();        
        StartCam();      

        PathConfig.SaveFolder = SavePath;
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
            Microphone.End(null);
            TimeText.text = "";
            
            MuteWindows(); //Unmute

            Replaying = true;                        

            VideoPlayer.instance.enabled = true;
            VideoPlayer.instance.SetRootFolder();
            VideoPlayer.instance.PlayLastVideo();            
        }

        if(CaptureControl.status == VideoCaptureCtrlBase.StatusType.STARTED) {
            currentTime = currentTime.AddSeconds(Time.deltaTime * -1);
            currentTimeFloat -= Time.deltaTime;
            TimeText.text = currentTime.ToString("mm:ss.ff");

            if(currentTimeFloat <= 0) {
                CaptureControl.StopCapture(); 	
                microphone.enabled = false;          
            }
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
            microphone.enabled = false;
            TimeText.text = "WAIT";
        } else if(CaptureControl.status == VideoCaptureCtrlBase.StatusType.NOT_START) {
            CaptureControl.StartCapture();
        }        
    }
}
