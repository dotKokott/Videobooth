Shader "Unlit/WebcamShader"
{
	Properties
	{
		_MainTex ("Texture", 2D) = "white" {}
		_Side ("Side", Int) = 0
	}
	SubShader
	{
		Tags { "RenderType"="Opaque" }

		Pass
		{
			CGPROGRAM
			#pragma vertex vert
			#pragma fragment frag
			
			#include "UnityCG.cginc"

			struct appdata
			{
				float4 vertex : POSITION;
				float2 uv : TEXCOORD0;
			};

			struct v2f
			{
				float2 uv : TEXCOORD0;
				UNITY_FOG_COORDS(1)
				float4 vertex : SV_POSITION;
			};

			sampler2D _MainTex;
			float4 _MainTex_ST;
			float _Side;
			
			v2f vert (appdata v)
			{
				v2f o;
				o.vertex = UnityObjectToClipPos(v.vertex);
				o.uv = TRANSFORM_TEX(v.uv, _MainTex);
				UNITY_TRANSFER_FOG(o,o.vertex);
				return o;
			}
			
			fixed4 frag (v2f i) : SV_Target
			{
				float2 p = i.uv;
				
				if (_Side == 0){
					if (p.x > 0.5) p.x = 1.0 - p.x;
				}else if (_Side == 1){
					if (p.x < 0.5) p.x = 1.0 - p.x;
				}else if (_Side == 2){
					if (p.y < 0.5) p.y = 1.0 - p.y;
				}else if (_Side == 3){
					if (p.y > 0.5) p.y = 1.0 - p.y;
				}else if (_Side == 4){
					if (p.y > 0.5) p.y = 1.0 - p.y;                
					if (p.x < 0.5) p.x = 1.0 - p.x;               
				}else if (_Side == 5){
					if (p.y < 0.5) p.y = 1.0 - p.y;                
					if (p.x > 0.5) p.x = 1.0 - p.x;                      
				}else if (_Side == 6){
					if (p.y > 0.5) p.y = 1.0 - p.y;                
					if (p.x > 0.5) p.x = 1.0 - p.x;                  
				}else if (_Side == 7){
					if (p.y < 0.5) p.y = 1.0 - p.y;                
					if (p.x < 0.5) p.x = 1.0 - p.x;                
				} 




				fixed4 col = tex2D(_MainTex, p);			

				return col;
			}
			ENDCG
		}
	}
}
