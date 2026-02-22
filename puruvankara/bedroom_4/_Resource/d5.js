"use strict";


/**
 * 定义键盘按键的 code；存储按键状态
 */
class Keyboard {
  static KEYCODE_W = 87;
  static KEYCODE_A = 65;
  static KEYCODE_S = 83;
  static KEYCODE_D = 68;
  key_w = false;
  key_a = false;
  key_s = false;
  key_d = false;

  static KEYCODE_Q = 81;
  static KEYCODE_E = 69;
  key_q = false;
  key_e = false;

  static KEYCODE_SPACE = 32;
  static KEYCODE_SHIFT = 16;
  static KEYCODE_CTRL = 17;
  key_space = false;
  key_shift = false;
  key_ctrl = false;

  static KEYCODE_F = 70;
  static KEYCODE_C = 67;
  static KEYCODE_Y = 89;
  static KEYCODE_B = 66;
  key_f = false;
  key_c = false;
  key_y = false;
  key_b = false;

  wheel_delta = 0;

  constructor() {}

  /**
   * @param krpano {IKrpano}
   * @param pressed {boolean}
   */
  update_key_status(krpano, pressed) {
    const keycode = krpano.get("keycode");

    if (keycode === Keyboard.KEYCODE_W) this.key_w = pressed;
    if (keycode === Keyboard.KEYCODE_A) this.key_a = pressed;
    if (keycode === Keyboard.KEYCODE_S) this.key_s = pressed;
    if (keycode === Keyboard.KEYCODE_D) this.key_d = pressed;

    if (keycode === Keyboard.KEYCODE_Q) this.key_q = pressed;
    if (keycode === Keyboard.KEYCODE_E) this.key_e = pressed;

    if (keycode === Keyboard.KEYCODE_F) this.key_f = pressed;
    if (keycode === Keyboard.KEYCODE_C) this.key_c = pressed;
    if (keycode === Keyboard.KEYCODE_Y) this.key_y = pressed;
    if (keycode === Keyboard.KEYCODE_B) this.key_b = pressed;

    if (keycode === Keyboard.KEYCODE_SHIFT) this.key_shift = pressed;
    if (keycode === Keyboard.KEYCODE_SPACE) this.key_space = pressed;
    if (keycode === Keyboard.KEYCODE_CTRL) this.key_ctrl = pressed;
  }

  /**
   * 获取鼠标的输入
   * @param krpano {IKrpano}
   */
  update_mouse_status(krpano) {
    // range: [-3, +3]
    this.wheel_delta = krpano.get("wheeldelta");
  }

  /**
   * 获取鼠标滚轮的值，并清零
   * @return {number}
   */
  get_wheel_and_reset() {
    const temp = this.wheel_delta;
    this.wheel_delta = 0;
    return temp;
  }
}

class IKrpano {
  device = {
    mobile: false,
  };
  xml = {
    scene: "",
  };
  actions = {
    /**
     * @type {function(...): void}
     */
    tween: undefined,
    /**
     * @type {function(...): void}
     */
    loadscene: undefined,
    /**
     * @type {function(...): void}
     */
    lookto: undefined,
    /**
     * @type {function(function(): boolean): void}
     * true = keep looping, false = stop looping
     */
    renderloop: undefined,
    /**
     * @type {function(string, number, number, number, number, number, number, number, string): void}
     */
    set3dtransition: undefined,
    /**
     * @type {function(number, number, number, number, number, number): null |{
     *  d: number,
     *  x: number, y: number, z: number,
     *  nx: number, ny: number, nz: number,
     *  rx: number, ry: number, rz: number
     * }}
     */
    raycastdepth: undefined,
  };
  mouse = {
    leftbutton: false,
    rightbutton: false,
    middlebutton: false,
    shiftkey: false,
    ctrlkey: false,
    altkey: false,
  };
  view = {
    dir: {
      // current right direction
      rx: 0,
      ry: 0,
      rz: 0, // current upward direction
      ux: 0,
      uy: 0,
      uz: 0, // current view diretion
      x: 0,
      y: 0,
      z: 0,
    },
    hlookat: 0,
    vlookat: 0,
    fov: 0,

    tx: 0,
    ty: 0,
    tz: 0,

    ox: 0,
    oy: 0,
    oz: 0,

    fovmin: 0,
    fovmax: 0,
  };

  control = {
    invert: false,
    // 是否允许使用鼠标控制 fov
    mousefovchange: 1,
  };

  /**
   * 自定义字段：表示当前是否是 dollhouse 模式
   * @details 这个字段是给 loadscene 使用的，<scene> 标签会读取该属性决定加载 pano 场景还是 dollhouse 场景
   * @type {string}
   */
  dollhouse = "";

  display = {
    /**
     * @type {function(number, number, number, string): {frication: number, accel: number, inertia: number}}
     */
    getAdaptiveFrictions: undefined,
  };

  // ms
  timertick = 0;

  /**
   * @type {function(...)}
   */
  call = undefined;

  /**
   * @type {function(...)}
   */
  get = undefined;

  /**
   * @type {function(...)}
   */
  set = undefined;
}

/**
 * 向量类型
 */
class Vec3 {
  x = 0;
  y = 0;
  z = 0;

  /**
   * @return {Vec3}
   */
  static zero() {
    return new Vec3(0, 0, 0);
  }

  /**
   * @param x {number}
   * @param y {number}
   * @param z {number}
   */
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * @param arr {[number, number, number]}
   * @return {Vec3}
   */
  static from_array(arr) {
    return new Vec3(arr[0], arr[1], arr[2]);
  }

  /**
   * @param v {Vec3}
   * @return {[number, number, number]}
   */
  static to_array(v) {
    return [v.x, v.y, v.z];
  }

  /**
   * 向量点乘
   * @param lhs {Vec3}
   * @param rhs {Vec3}
   * @return {number}
   */
  static dot(lhs, rhs) {
    return lhs.x * rhs.x + lhs.y * rhs.y + lhs.z * rhs.z;
  }

  /**
   * 向量数乘
   * @param v {Vec3}
   * @param n {number}
   * @return {Vec3}
   */
  static times(v, n) {
    return new Vec3(v.x * n, v.y * n, v.z * n);
  }

  /**
   * 向量叉乘，注意顺序
   * @param lhs {Vec3}
   * @param rhs {Vec3}
   * @return {Vec3}
   */
  static cross(lhs, rhs) {
    return new Vec3(
      lhs.y * rhs.z - lhs.z * rhs.y,
      lhs.z * rhs.x - lhs.x * rhs.z,
      lhs.x * rhs.y - lhs.y * rhs.x
    );
  }

  /**
   * 向量加法
   * @param lhs {Vec3}
   * @param rhs {Vec3}
   * @return {Vec3}
   */
  static add(lhs, rhs) {
    return new Vec3(lhs.x + rhs.x, lhs.y + rhs.y, lhs.z + rhs.z);
  }

  /**
   * 向量减法
   * @param lhs {Vec3}
   * @param rhs {Vec3}
   * @return {Vec3}
   */
  static sub(lhs, rhs) {
    return new Vec3(lhs.x - rhs.x, lhs.y - rhs.y, lhs.z - rhs.z);
  }

  /**
   * 向量正规化
   * @param v {Vec3}
   * @return {Vec3}
   */
  static normalize(v) {
    const ERROR_VEC = new Vec3(1, 0, 0);
    const EPSILON = 1e-6;
    try {
      let len = Math.sqrt(Vec3.dot(v, v));
      if (len < EPSILON) {
        return ERROR_VEC;
      }
      return new Vec3(v.x / len, v.y / len, v.z / len);
    } catch (e) {
      return ERROR_VEC;
    }
  }

  /**
   * 向量的长度
   * @param v {Vec3}
   * @return {number}
   */
  static lenth(v) {
    return Math.sqrt(Vec3.dot(v, v));
  }
}

/**
 * 与 meta.json 中的 hotspot 对应
 */
class HotSpotData {
  hotspotName = "";
  srcScene = "";
  dstScene = "";

  /**
   * hotspot 在当前场景中的 sphere 坐标
   *
   * 计算方法：根据两个场景的相机位置得到
   * @type {Vec3}
   */
  hotspotSphereCoord = Vec3.zero();

  /**
   * hotspot 在当前场景中的 3D 坐标
   *
   * 根据 hotspot 位置，而非相机位置得到
   *
   * * 2.10 之前：由 UE 计算得到基于某个场景的 krpano pos
   * * 2.10 ：由 UE 计算能得到基于起始场景的 krpano pos
   * @type {Vec3}
   */
  hotspot3DCoord = Vec3.zero();

  /**
   * hotspot 在当前场景中的 3D 旋转欧拉角
   *
   * FIXME: 直接就是 UE 中的欧拉角，看起来有一些问题
   * @type {Vec3}
   */
  hotspotRotate = Vec3.zero();

  /**
   * hotspot 到场景中心的距离，可以用于最近跳转
   * @type {number}
   */
  distance = 0;
  cameraPointType = "";

  /**
   * krpano 的 sphere 坐标系，默认 depth 为 1000；如果使用 3D 坐标系，应当将 depth 设为 0
   * @type {number}
   */
  depth = 1000;

  constructor() {}
}

/**
 * 与 meta.json 中的 scene 对应
 */
class SceneData {
  cameraPos = Vec3.zero();
  cameraRotate = Vec3.zero();
  depthImageUrl = "";
  normalImageUrl = "";
  sceneName = "";

  /**
   * see `HotSpotData`
   * @type {HotSpotData[]}
   */
  hotspotArray = [];
  startScene = false;
  depthWhiteDistance = 0;
  depthBlackDistance = 1000;

  /**
   * 基于 krpano 的坐标系，当前场景的坐标
   *
   * * 2.10 之前，krpano 每个场景的坐标系都是不同的，原点与场景对齐，初始方向就是场景记录的方向
   * * 2.10 及之后，krpano 中，使用 start scene 的 mesh 作为公共模型，因此每个场景的坐标以 start scene 作为参考
   * @type {Vec3}
   */
  relativePos= Vec3.zero();

  /**
   * 当前场景的 krpano 坐标系原点在 UE 坐标系中的位置
   *
   * * 2.10 之前，就是当前场景的 CameraPos
   * * 2.10 及之后，就是 startScene 的 CameraPos
   * @type {Vec3}
   */
  kr_coord_origin_in_ue = Vec3.zero();

  /**
   * krpano 场景的初始朝向在 UE 中的 yaw 角度值
   * @type {number}
   */
  kr_coord_dir_in_ue = 0;

  constructor() {}
}

/**
 * 与 meta.json 对应
 */
class IMetaJson {
  /**
   * @type {SceneData[]}
   */
  sceneArray = [];
  pivotColor = {
    r: 0,
    g: 0,
    b: 0,
    a: 1,
  };
  region = "";
  version = ""; // 2.8.0
}

class Tools {
  /**
   * 角度转弧度
   * @param angle {number}
   * @returns {number}
   */
  static deg2rad(angle) {
    return (angle / 180) * Math.PI;
  }

  /**
   * 弧度转角度
   * @param degree {number}
   * @returns {number}
   */
  static rad2deg(degree) {
    return (degree / Math.PI) * 180.0;
  }


  /**
   * 将球坐标系的角度范围限制在 [-180, 180] * [-90, 90]
   * @param h {number}
   * @param v {number}
   * @returns {[number, number]}
   */
  static clamp_angle(h, v) {
    h = h % 360.0;
    if (h < -180.0) h += 360.0;
    if (h > 180.0) h -= 360.0;

    v = v % 180.0;
    if (v < -90.0) v += 180.0;
    if (v > 90.0) v -= 180.0;

    return [h, v];
  }

  /**
   * 将颜色向量转化为的颜色字符串
   * @param r {number} 0-255
   * @param g {number} 0-255
   * @param b {number} 0-255
   * @returns {string} 000000-ffffff
   */
  static color_vec_to_str(r, g, b) {
    const f = (val) =>
      (
        "0" + Math.min(255, Math.max(0, Math.floor(val * 255))).toString(16)
      ).slice(-2);
    const gamma = (val) => Math.pow(val, 1 / 2.25);

    return f(gamma(r)) + f(gamma(g)) + f(gamma(b));
  }

  /**
   * 加载图片，使用 cbk 来读取图片数据
   * @param image_url {string}
   * @param cbk {function(ImageData): void}
   */
  static load_image(image_url, cbk) {
    let canvas = document.getElementById("image_helper");
    let ctx = canvas.getContext("2d", { willReadFrequently: true });
    let img = new Image();
    img.src = image_url;

    img.onload = () => {
      let w = Math.floor(img.width),
        h = Math.floor(img.height);
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      let img_data = ctx.getImageData(0, 0, w, h);
      cbk(img_data);
    };
  }

  /**
   * @param color {string}
   * @return {string}
   */
  static gen_floor_pivot_url(color) {
    const svg = `
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clip-path="url(#clip0_3_6)">
        <path fill-rule="evenodd" clip-rule="evenodd"
              d="M128 253.188C197.139 253.188 253.188 197.139 253.188 128C253.188 58.8609 197.139 2.8125 128 2.8125C58.8609 2.8125 2.8125 58.8609 2.8125 128C2.8125 197.139 58.8609 253.188 128 253.188ZM128 190.625C162.587 190.625 190.625 162.587 190.625 128C190.625 93.4132 162.587 65.375 128 65.375C93.4132 65.375 65.375 93.4132 65.375 128C65.375 162.587 93.4132 190.625 128 190.625Z"
              fill="url(#paint0_radial_3_6)" fill-opacity="0.15"/>
        <circle cx="128" cy="128" r="34.25" fill="#${color}" fill-opacity="0.2"/>
        <g filter="url(#filter0_f_3_6)">
            <circle cx="128" cy="128" r="40.0625" fill="#${color}" fill-opacity="0.1"/>
        </g>
        <path fill-rule="evenodd" clip-rule="evenodd"
              d="M128 159.5C145.397 159.5 159.5 145.397 159.5 128C159.5 110.603 145.397 96.5 128 96.5C110.603 96.5 96.5 110.603 96.5 128C96.5 145.397 110.603 159.5 128 159.5ZM128 133.688C131.141 133.688 133.688 131.141 133.688 128C133.688 124.859 131.141 122.312 128 122.312C124.859 122.312 122.312 124.859 122.312 128C122.312 131.141 124.859 133.688 128 133.688Z"
              fill="#${color}"/>
        <path fill-rule="evenodd" clip-rule="evenodd"
              d="M128 190.625C162.587 190.625 190.625 162.587 190.625 128C190.625 93.4131 162.587 65.375 128 65.375C93.4132 65.375 65.375 93.4131 65.375 128C65.375 162.587 93.4132 190.625 128 190.625ZM128 186.152C160.116 186.152 186.152 160.116 186.152 128C186.152 95.8837 160.116 69.8482 128 69.8482C95.8836 69.8482 69.8482 95.8837 69.8482 128C69.8482 160.116 95.8836 186.152 128 186.152Z"
              fill="#${color}" fill-opacity="0.25"/>
        <path fill-rule="evenodd" clip-rule="evenodd"
              d="M128 198.125C166.729 198.125 198.125 166.729 198.125 128C198.125 89.2711 166.729 57.875 128 57.875C89.271 57.875 57.875 89.2711 57.875 128C57.875 166.729 89.271 198.125 128 198.125ZM128 190.625C162.587 190.625 190.625 162.587 190.625 128C190.625 93.4131 162.587 65.375 128 65.375C93.4132 65.375 65.375 93.4131 65.375 128C65.375 162.587 93.4132 190.625 128 190.625Z"
              fill="#${color}" fill-opacity="0.04"/>
        <path opacity="0.8" fill-rule="evenodd" clip-rule="evenodd"
              d="M128 208.5C172.459 208.5 208.5 172.459 208.5 128C208.5 83.5411 172.459 47.5 128 47.5C83.5411 47.5 47.5 83.5411 47.5 128C47.5 172.459 83.5411 208.5 128 208.5ZM128 198.125C166.729 198.125 198.125 166.729 198.125 128C198.125 89.2711 166.729 57.875 128 57.875C89.271 57.875 57.875 89.2711 57.875 128C57.875 166.729 89.271 198.125 128 198.125Z"
              fill="#${color}" fill-opacity="0.04"/>
        <path opacity="0.4" fill-rule="evenodd" clip-rule="evenodd"
              d="M128 219.812C178.707 219.812 219.812 178.707 219.812 128C219.812 77.2934 178.707 36.1875 128 36.1875C77.2934 36.1875 36.1875 77.2934 36.1875 128C36.1875 178.707 77.2934 219.812 128 219.812ZM128 208.5C172.459 208.5 208.5 172.459 208.5 128C208.5 83.5411 172.459 47.5 128 47.5C83.5411 47.5 47.5 83.5411 47.5 128C47.5 172.459 83.5411 208.5 128 208.5Z"
              fill="#${color}" fill-opacity="0.04"/>
        <path opacity="0.2" fill-rule="evenodd" clip-rule="evenodd"
              d="M128 237.625C188.544 237.625 237.625 188.544 237.625 128C237.625 67.4558 188.544 18.375 128 18.375C67.4558 18.375 18.375 67.4558 18.375 128C18.375 188.544 67.4558 237.625 128 237.625ZM128 219.812C178.707 219.812 219.812 178.707 219.812 128C219.812 77.2934 178.707 36.1875 128 36.1875C77.2934 36.1875 36.1875 77.2934 36.1875 128C36.1875 178.707 77.2934 219.812 128 219.812Z"
              fill="#${color}" fill-opacity="0.04"/>
        <path fill-rule="evenodd" clip-rule="evenodd"
              d="M128 251.062C195.966 251.062 251.062 195.966 251.062 128C251.062 60.0345 195.966 4.9375 128 4.9375C60.0345 4.9375 4.9375 60.0345 4.9375 128C4.9375 195.966 60.0345 251.062 128 251.062ZM128 237.901C188.696 237.901 237.901 188.697 237.901 128C237.901 67.3035 188.696 18.0993 128 18.0993C67.3035 18.0993 18.0992 67.3035 18.0992 128C18.0992 188.697 67.3035 237.901 128 237.901Z"
              fill="#${color}" fill-opacity="0.02"/>
    </g>
    <defs>
        <filter id="filter0_f_3_6" x="-12.0625" y="-12.0625" width="280.125" height="280.125"
                filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
            <feGaussianBlur stdDeviation="50" result="effect1_foregroundBlur_3_6"/>
        </filter>
        <radialGradient id="paint0_radial_3_6" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(128 128) rotate(90) scale(125.187)">
            <stop stop-color="#${color}"/>
            <stop offset="1" stop-color="#${color}" stop-opacity="0"/>
        </radialGradient>
        <clipPath id="clip0_3_6">
            <rect width="256" height="256" fill="white"/>
        </clipPath>
    </defs>
</svg>
    `;

    return "data:image/svg+xml;base64," + btoa(svg);
  }


  /**
   * @param color {string}
   * @return {string}
   */
  static gen_fly_pivot_url(color) {
    const svg = `
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M128 222C179.915 222 222 179.915 222 128C222 76.0852 179.915 34 128 34C76.0852 34 34 76.0852 34 128C34 179.915 76.0852 222 128 222Z" fill="#${color}" fill-opacity="0.2" stroke="#${color}" stroke-width="8"/>
    <path d="M149 116L167 110V146L149 140" stroke="white" stroke-width="9.6" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M149 143V113C149 109.686 146.314 107 143 107H95C91.6863 107 89 109.686 89 113V122V143C89 146.314 91.6863 149 95 149H143C146.314 149 149 146.314 149 143Z" stroke="white" stroke-width="9.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
    `;

    return "data:image/svg+xml;base64," + btoa(svg);
  }


  /**
   * @param color {string}
   * @return {string}
   */
  static gen_mouse_pivot_url(color) {
    const svg = `
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd"
          d="M128.031 181.688C157.699 181.688 181.75 157.637 181.75 127.969C181.75 98.3007 157.699 74.25 128.031 74.25C98.3632 74.25 74.3125 98.3007 74.3125 127.969C74.3125 157.637 98.3632 181.688 128.031 181.688ZM128.031 151.081C140.796 151.081 151.144 140.734 151.144 127.969C151.144 115.204 140.796 104.856 128.031 104.856C115.266 104.856 104.919 115.204 104.919 127.969C104.919 140.734 115.266 151.081 128.031 151.081Z"
          fill="#${color}" fill-opacity="0.3"/>
    <path fill-rule="evenodd" clip-rule="evenodd"
          d="M128.031 178.5C155.939 178.5 178.562 155.876 178.562 127.969C178.562 100.061 155.939 77.4375 128.031 77.4375C100.124 77.4375 77.5 100.061 77.5 127.969C77.5 155.876 100.124 178.5 128.031 178.5ZM128.031 153.125C141.925 153.125 153.188 141.862 153.188 127.969C153.188 114.075 141.925 102.812 128.031 102.812C114.138 102.812 102.875 114.075 102.875 127.969C102.875 141.862 114.138 153.125 128.031 153.125Z"
          fill="#${color}"/>
    <path fill-rule="evenodd" clip-rule="evenodd"
          d="M128.031 236.062C187.73 236.062 236.125 187.667 236.125 127.969C236.125 68.2702 187.73 19.875 128.031 19.875C68.3327 19.875 19.9375 68.2702 19.9375 127.969C19.9375 187.667 68.3327 236.062 128.031 236.062ZM128.031 181.782C157.751 181.782 181.844 157.689 181.844 127.969C181.844 98.2487 157.751 74.1559 128.031 74.1559C98.3112 74.1559 74.2184 98.2487 74.2184 127.969C74.2184 157.689 98.3112 181.782 128.031 181.782Z"
          fill="url(#paint0_radial_7_35)" fill-opacity="0.2"/>
    <defs>
        <radialGradient id="paint0_radial_7_35" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(128.031 127.969) rotate(90) scale(108.094)">
            <stop stop-color="#${color}"/>
            <stop offset="1" stop-color="#${color}" stop-opacity="0"/>
        </radialGradient>
    </defs>
</svg>
`;

    return "data:image/svg+xml;base64," + btoa(svg);
  }

  /**
   * 两个浮点数是否相等
   * @param a {number}
   * @param b {number}
   * @return {boolean}
   */
  static nearly_equal(a, b) {
    const epsilon = 1e-6;
    return Math.abs(a - b) < epsilon;
  }
}

class Version {
  /**
   *
   * @param version_str {string}
   * @return {[number, number, number]}
   */
  static parse_version_str(version_str) {
    const default_version = [2, 8, 0];
    if (!version_str) {
      return default_version;
    }

    let version_num = version_str.split('.').map(Number);

    if (version_num.length !== 3 || version_num.map(isNaN).includes(true)) {
      return default_version;
    }
    return version_num;
  }

  /**
   * @param version1 {[number, number, number]}
   * @param version2 {[number, number, number]}
   * @return {boolean}
   */
  static less_than(version1, version2) {
    for (let i = 0; i < 3; i++) {
      if (version1[i] < version2[i]) {
        return true;
      } else if (version1[i] > version2[i]) {
        return false;
      }
    }
    return false;
  }

  /**
   * @param version1 {[number, number, number]}
   * @param version2 {[number, number, number]}
   * @return {boolean}
   */
  static equal(version1, version2) {
    return version1[0] === version2[0] && version1[1] === version2[1] && version1[2] === version2[2];
  }
}

/**
 * dollhouse 模式下的导航参数
 */
class DepthNavigation {
  movemode = "flying";
  speed = 5.0;
  friction = 0.9;
  collision = true;
  stopdistance = 30.0;
  moveback = 1.2;
  bounceback = 1.6;

  constructor() {}
}

/**
 * dollhouse 模式下的漫游参数
 */
class WalkAround {
  forward = 0;
  backward = 0;
  left = 0;
  right = 0;
  up = 0;
  down = 0;
  faster = 0;
  relativespeed = false;
  wheel_delta = 0;

  constructor() {}
}

class DollhouseControl {
  settings = new DepthNavigation();
  walkaround = new WalkAround();
  /**
   * 引用项目存档
   * @type {ProjectData}
   */
  project = undefined;
  /**
   * 引用键盘状态
   * @type {Keyboard}
   */
  keyboard = undefined;

  /**
   * @param project {ProjectData}
   * @param keyboard {Keyboard}
   */
  constructor(project, keyboard) {
    this.project = project;
    this.keyboard = keyboard;
  }

  /**
   *
   * @param krpano {IKrpano}
   */
  walk_control(krpano) {
    const mouse = krpano.mouse;
    const view = krpano.view;
    let dir = view.dir;

    let rx = 0;
    let lasttick = krpano.timertick;

    let krpano_control = () => {
      if (Version.equal(this.project.version_num, [2, 8, 0])) {
        return;
      }
      let vv = new Vec3(0, 0, 0);

      this.get_move_from_keyboard(this.keyboard);
      this.walkaround.wheel_delta = this.keyboard.get_wheel_and_reset();

      lasttick = krpano.timertick;

      // 摩擦力
      let friction = this.settings.friction;
      // 加速度
      let acceleration = 1.0;
      // 惯性
      let inertia = 1.0;
      let ty_raycast_offset = 0.0;

      // adjust the friction and acceleration depending on the framerate (an experimental API)
      if (krpano.display.getAdaptiveFrictions) {
        let adjustedmovment = krpano.display.getAdaptiveFrictions(
          friction,
          acceleration / friction,
          inertia,
          "fast"
        );
        friction = adjustedmovment.friction;
        acceleration = adjustedmovment.accel * friction;
      }

      Vec3.times(vv, friction);
      rx *= friction;

      if (Vec3.dot(vv, vv) < 0.001) vv = Vec3.zero();
      if (rx * rx < 0.01) rx = 0;

      let h = (view.hlookat * Math.PI) / 180.0;

      // 2D direction vector (walking)
      let lx2 = Math.sin(h);
      let lz2 = Math.cos(h);

      // 3D direction vector (flying)
      let l3 = new Vec3(dir.x, dir.y, dir.z);

      let wx = this.walkaround.right - this.walkaround.left;
      let wy = this.walkaround.up - this.walkaround.down;
      let wz = this.walkaround.forward - this.walkaround.backward;

      let wl = Math.sqrt(wx * wx + wz * wz);
      if (wl > 0) {
        if (this.walkaround.relativespeed) {
          wl *= acceleration * this.settings.speed;
        } else {
          // normalize the moving speed
          wl = (acceleration * this.settings.speed) / wl;
        }

        if (this.walkaround.faster > 0) wl *= 3.0;

        wx *= wl;
        wz *= wl;
        if (wx) {
          vv.x += wx * lz2;
          vv.z -= wx * lx2;
        }
        if (wz) {
          if (this.settings.movemode === "flying") {
            vv = Vec3.add(vv, Vec3.times(l3, wz));
          } else {
            vv.x += wz * lx2;
            vv.z += wz * lz2;
          }
        }
      }

      vv.y -= 0.5 * acceleration * this.settings.speed * wy;

      if (
        (mouse.leftbutton && mouse.shiftkey) ||
        mouse.middlebutton ||
        mouse.rightbutton
      ) {
        let is_dollhouse_view = view.oz > 100;
        let extrakey = mouse.ctrlkey | mouse.altkey;

        let dragspeed = (is_dollhouse_view ? 0.1 : 0.05) * acceleration;
        let dx = -dragspeed * mouse.dx;
        let dy = extrakey ^ is_dollhouse_view ? +dragspeed * mouse.dy : 0;
        let dz = extrakey ^ is_dollhouse_view ? 0 : +dragspeed * mouse.dy;

        vv.x += dx * dir.rx + dy * dir.ux + dz * dir.x;
        vv.y +=
          dx * dir.ry +
          dy * dir.uy +
          dz * dir.y * (this.settings.movemode === "flying");
        vv.z += dx * dir.rz + dy * dir.uz + dz * dir.z;
      }

      let vspeed = Vec3.lenth(vv);

      if (vspeed > 0) {
        // simple collision testing
        if (this.settings.collision && view.oz < 200) {
          // do collision testing only in non-dollhouse-view
          let hit = krpano.actions.raycastdepth(
            view.tx,
            view.ty + ty_raycast_offset,
            view.tz,
            vv.x,
            vv.y,
            vv.z
          );
          if (hit) {
            if (hit.d > 0 && hit.d < this.settings.stopdistance) {
              // slide along walls
              let vlen = Vec3.lenth(vv);
              if (vlen > 0) {
                let pushback =
                  (-(this.settings.stopdistance - hit.d) / vlen) *
                  this.settings.moveback;

                view.tx += pushback * vv.x;
                view.ty += pushback * vv.y;
                view.tz += pushback * vv.z;

                let hitscale =
                  (vv.x * hit.nx + vv.y * hit.ny + vv.z * hit.nz) *
                  this.settings.bounceback;

                vv.x -= hit.nx * hitscale;
                vv.y -= hit.ny * hitscale;
                vv.z -= hit.nz * hitscale;
              }
            }
          }
        }

        view.tx += vv.x;
        view.ty += vv.y;
        view.tz += vv.z;
      }

      // 使用 wheel 控制视角
      if (this.project.get_is_dollhouse()) {
        view.oz -= this.walkaround.wheel_delta * this.project.get_dollhouse_zoom_speed();
      }

      return true;
    };

    krpano.actions.renderloop(krpano_control);
  }

  /**
   * 从键盘状态中获取移动信息
   * @param keyboard {Keyboard}
   */
  get_move_from_keyboard(keyboard) {
    this.walkaround.forward = keyboard.key_w ? 1 : 0;
    this.walkaround.backward = keyboard.key_s ? 1 : 0;
    this.walkaround.left = keyboard.key_a ? 1 : 0;
    this.walkaround.right = keyboard.key_d ? 1 : 0;
    this.walkaround.up = keyboard.key_q ? 1 : 0;
    this.walkaround.down = keyboard.key_e ? 1 : 0;
  }
}

class EViewMode {
  static PANOROAM = "panoroam";
  static DOLLHOUSE = "dollhouse";
}

class ECameraPointType {
  static FLY = "Fly";
  static FLOOR = "Floor";
}

class Scene {
  /**
   * 场景数据
   * @type {SceneData}
   */
  scene_data = undefined;

  /**
   * 深度数据
   * @type {ImageData}
   */
  depth_image = undefined;

  /**
   * 法线数据
   * @type {ImageData}
   */
  normal_image = undefined;

  /**
   * 当前场景是否是 dollhouse 模式，与 krpano.dollhouse 同步
   * @type {string}
   */
  view_mode = EViewMode.PANOROAM;
}


/**
 * 场景切换时用到的数据
 */
class TransData {
  // 下一个场景的模式：panoroam，dollhouse
  dst_scene_mode = EViewMode.PANOROAM;

  // 起始场景的模式
  src_scene_mode = EViewMode.PANOROAM;

  // 是否有场景切换的动画
  has_anime = false;

  /**
   * 跳转的起始场景
   * @type {SceneData}
   */
  src_scene = undefined;

  /**
   * 场景切换完成后，重置数据
   */
  reset_trans_data() {
    this.dst_scene_mode = EViewMode.PANOROAM;
    this.src_scene_mode = EViewMode.PANOROAM;
    this.src_scene = undefined;
    this.has_anime = false;
  }

  /**
   * 场景切换之前，准备切换的数据
   * @param has_anime {boolean}
   * @param src_scene {Scene}
   * @param dst_view_mode {string}
   */
  prepare_trans_data(has_anime, src_scene, dst_view_mode) {
    this.has_anime = has_anime;
    this.dst_scene_mode = dst_view_mode;
    this.src_scene_mode = src_scene.view_mode;
    this.src_scene = src_scene.scene_data;
  }
}


/**
 * 坐标变换相关的工具函数
 *
 * * ue_pos：ue 中的坐标
 * * kr_pos: krpano 中的 3D 坐标
 * * sphere: 基于某个场景的，该场景中的方向
 * * dir：基于某个场景的，该场景中的方向
 */
class CoordTools {

  /**
   * krpano 中的 UP 方向
   * @type {Vec3}
   */
  static UP = new Vec3(0, -1, 0);

  /**
   * krpano 方向的表示方法变换，从 3D 坐标系转换为球坐标系
   *
   * 由于不涉及坐标系变换（坐标系中心始终固定），因此这个变换是场景无关的
   * @param dir {Vec3}
   * @returns {[number, number]}
   */
  static kr_dir_to_kr_sphere(dir) {
    // 先对方向向量做归一化处理
    let len = Vec3.lenth(dir);
    if (len < 1e-6) {
      return [0, 0];
    }
    const v = Vec3.normalize(dir);

    let v_deg = Tools.rad2deg(Math.asin(v.y));
    let h_deg = Tools.rad2deg(Math.atan2(v.x, v.z));
    return [h_deg, v_deg];
  }

  /**
   * krpano 方向的表示方法变换，从球坐标系转换为 3D 坐标系
   *
   * 由于不涉及坐标系变换（坐标系中心始终固定），因此这个变换是场景无关的
   * @param sphere {[number, number]}
   * @returns {Vec3} 归一化的方向向量
   */
  static kr_sphere_to_kr_dir(sphere) {
    const [h, v] = sphere;
    let v_deg = Tools.deg2rad(v);
    let h_deg = Tools.deg2rad(h);
    let y = Math.sin(v_deg);
    let d = Math.cos(v_deg);
    let x = d * Math.sin(h_deg);
    let z = d * Math.cos(h_deg);
    return new Vec3(x, y, z);
  }

  /**
   * 获得鼠标指向方向的球坐标，坐标系的中心是当前的相机位置
   * @param krpano {IKrpano}
   * @returns {[number, number]}
   */
  static get_mouse_sphere(krpano) {
    krpano.call("screentosphere(mouse.x, mouse.y, mth, mtv)");
    let mouse_h = krpano.get("mth");
    let mouse_v = krpano.get("mtv");
    return [mouse_h, mouse_v];
  }

  /**
   * 屏幕坐标转化为 krpano 的球坐标方向
   *
   * 由于不涉及坐标系变换（坐标系中心始终固定），因此这个变换是场景无关的
   * @param krpano {IKrpano}
   * @param screen_coord {[number, number]}
   * @returns {[number, number]}
   */
  static screen_coord_to_kr_sphere(krpano, screen_coord) {
    krpano.call(
      `screentosphere(${screen_coord[0]}, ${screen_coord[1]}, mth, mtv)`
    );
    let mouse_h = krpano.get("mth");
    let mouse_v = krpano.get("mtv");
    return Tools.clamp_angle(mouse_h, mouse_v);
  }

  /**
   * krpano 某个场景的 sphere 方向转换为图片的 uv 值 [0, 1]^2，线性映射
   *
   * 需要考虑场景和图片是否对齐
   * @param scene_sphere {[number, number]}
   * @param crt_scene {SceneData}
   * @return {[number, number]}
   */
  static kr_sphere_to_image_uv(scene_sphere, crt_scene) {
    let [view_h, view_v] = scene_sphere;
    [view_h, view_v] = Tools.clamp_angle(view_h - (crt_scene.cameraRotate.x - crt_scene.kr_coord_dir_in_ue), view_v);
    let u = view_h / 360 + 0.5;
    let v = view_v / 180 + 0.5;
    if (u < 0) u = 0;
    else if (u > 1) u = 1;
    if (v < 0) v = 0;
    else if (v > 1) v = 1;
    return [u, v];
  }


  /**
   * 从图片中获取某个像素的颜色，并不用考虑 SRGB 非线性颜色空间
   * @param image {ImageData} 当前场景中的某种图像数据
   * @param kr_sphere {[number, number]} 当前场景中的球坐标方向
   * @param crt_scene {SceneData}
   * @return {Uint8ClampedArray}
   */
  static get_pixel(image, kr_sphere, crt_scene) {
    let [u, v] = CoordTools.kr_sphere_to_image_uv(kr_sphere, crt_scene);

    let pixel_x = Math.floor(image.width * u);
    let pixel_y = Math.floor(image.height * v);

    let start_index = (pixel_y * image.width + pixel_x) * 4;
    return image.data.slice(start_index, start_index + 4);
  }

  /**
   * 获得场景中某个方向的深度信息
   * @param scene_sphere {[number, number]}
   * @param crt_scene {Scene}
   * @return {number} 返回深度范围值为 [0, 1]
   */
  static get_depth(scene_sphere, crt_scene) {
    if (
      crt_scene.depth_image.width < 1 ||
      crt_scene.depth_image.height < 1 ||
      crt_scene.depth_image.data.length < 1
    ) {
      return 1.0;
    }

    // RGB-encoding
    let pixel = CoordTools.get_pixel(crt_scene.depth_image, scene_sphere, crt_scene.scene_data);
    let low = pixel[0] / 255.0;
    let mid = pixel[1] / 255.0 / 256.0;
    let high = pixel[2] / 255.0 / 256.0 / 256.0;
    return low + mid + high;
  }

  /**
   * 获得场景中某个方向的法线信息
   * @param scene_sphere {[number, number]}
   * @param crt_scene {Scene}
   * @return {Vec3} 坐标是 krpano 的坐标系
   */
  static get_normal(scene_sphere, crt_scene) {
    if (!crt_scene.normal_image) {
      return CoordTools.UP;
    }
    let pixel = CoordTools.get_pixel(crt_scene.normal_image, scene_sphere, crt_scene.scene_data);
    let normal = [
      (pixel[0] * 2.0) / 255.0 - 1.0,
      (pixel[1] * 2.0) / 255.0 - 1.0,
      (pixel[2] * 2.0) / 255.0 - 1.0,
    ];
    // 考虑 OpenCV 的 BGR 顺序，考虑 krpano 与 UE 的坐标系差异
    normal = [normal[2], -normal[0], -normal[1]];

    // 考虑摄像机的旋转角度(UE 的 yaw=90 和 krpano 的初始角度对齐)
    const theta_degree = -Tools.deg2rad(90 + crt_scene.scene_data.kr_coord_dir_in_ue);
    const sin_theta = Math.sin(theta_degree);
    let cos_theta = Math.cos(theta_degree);
    let x = normal[0] * cos_theta + normal[2] * sin_theta;
    let z = normal[2] * cos_theta - normal[0] * sin_theta;
    return new Vec3(x, normal[1], z);
  }

  /**
   * 判断命中位置的法线是否有效
   * @param scene_sphere {[number, number]}
   * @param crt_scene {Scene}
   */
  static is_normal_valid(scene_sphere, crt_scene) {
    if (!crt_scene.normal_image) {
      return false;
    }

    const pixel = CoordTools.get_pixel(crt_scene.normal_image, scene_sphere, crt_scene.scene_data);
    return !(pixel[0] === 53 && pixel[1] === 53 && pixel[2] === 53);
  }

  /**
   * 获得场景指定方向的深度值，会考虑 depthBlackDistance 和 depthWhiteDistance
   * @param scene_sphere {[number, number]}
   * @param crt_scene {Scene}
   * @return {number}
   */
  static get_distance(scene_sphere, crt_scene) {
    const depth_black_distance = crt_scene.scene_data.depthBlackDistance || 0.0;
    const depth_white_distance = crt_scene.scene_data.depthWhiteDistance || 3000.0;
    let dis = CoordTools.get_depth(scene_sphere, crt_scene) * (depth_white_distance - depth_black_distance) + depth_black_distance;

    // 由于从 image 中读到的 depth 值最大为 1，因此不需要对最终的 distance 值做出限制
    dis = Math.max(100, dis);
    return dis;
  }

  /**
   * 判断某个 krpano 坐标位在当前场景的哪个方向上
   * @param kr_pos {Vec3}
   * @param crt_scene {SceneData}
   * @return {[number, number]} 基于相机位置的球坐标
   */
  static kr_pos_to_scene_sphere(kr_pos, crt_scene) {
    const local_pos1 = new Vec3(kr_pos.x, kr_pos.y, kr_pos.z);
    const relative_pos = Vec3.sub(local_pos1, crt_scene.relativePos);
    return CoordTools.kr_dir_to_kr_sphere(relative_pos);
  }

  /**
   * krpano 坐标系的 sphere 方向转换为 ue 坐标系中的方向
   * @param scene_sphere {[number, number]}
   * @param crt_scene {SceneData}
   * @return {Vec3}
   */
  static kr_sphere_to_ue_dir(scene_sphere, crt_scene) {
    const [h, v] = scene_sphere;

    let yaw_deg = Tools.deg2rad(h + crt_scene.kr_coord_dir_in_ue);
    let pitch_deg = Tools.deg2rad(-v);

    let ue_z = Math.sin(pitch_deg);
    let d = Math.cos(pitch_deg);
    let ue_x = d * Math.cos(yaw_deg);
    let ue_y = d * Math.sin(yaw_deg);

    return new Vec3(ue_x, ue_y, ue_z);
  }

  /**
   * 将 ue 坐标系中的方向转换为 krpano 坐标系中的某个方向
   * @param ue_dir {Vec3} 需要提供正规化的方向向量
   * @param crt_scene {SceneData}
   * @return {[number, number]}
   */
  static ue_dir_to_kr_sphere(ue_dir, crt_scene) {
    const ttt = Math.sqrt(ue_dir.x * ue_dir.x + ue_dir.y * ue_dir.y);
    let ue_pitch = Tools.rad2deg(Math.atan2(ue_dir.z, ttt));
    let ue_yaw = Tools.rad2deg(Math.atan2(ue_dir.y, ue_dir.x));

    let sphere_h = ue_yaw - crt_scene.kr_coord_dir_in_ue;
    let sphere_v = -ue_pitch;

    return [sphere_h, sphere_v];
  }

  /**
   * 根据 ue 坐标得到某个场景的 sphere 方向，使得该 ue 坐标位于 sphere 方向上
   * @param ue_pos {Vec3}
   * @param crt_scene {SceneData}
   * @return {[number, number]}
   */
  static ue_pos_to_scene_sphere(ue_pos, crt_scene) {
    if (!crt_scene) {
      return [0, 0];
    }

    const dir = Vec3.sub(ue_pos, crt_scene.cameraPos);
    return CoordTools.ue_dir_to_kr_sphere(dir, crt_scene);
  }

  /**
   * 在某个场景的 sphere 方向上找到最近的交点，返回其 pos
   * @param scene_sphere {[number, number]}
   * @param crt_scene {Scene}
   * @returns {Vec3}
   */
  static get_hit_kr_pos(scene_sphere, crt_scene) {
    let dir = CoordTools.kr_sphere_to_kr_dir(scene_sphere);
    const distance = CoordTools.get_distance(scene_sphere, crt_scene);
    let pos = Vec3.times(dir, distance);
    pos = Vec3.add(pos, crt_scene.scene_data.relativePos);
    return pos;
  }

  /**
   * 将 krpano 中的某个坐标转换为 ue 的坐标
   * @param kr_pos {Vec3}
   * @param crt_scene {SceneData}
   * @return {Vec3}
   */
  static kr_pos_to_ue_pos(kr_pos, crt_scene) {
    const kr_vec = kr_pos;

    const kr_sphere = CoordTools.kr_dir_to_kr_sphere(kr_vec);
    const ue_dir = CoordTools.kr_sphere_to_ue_dir(kr_sphere, crt_scene);

    return Vec3.add(crt_scene.kr_coord_origin_in_ue, Vec3.times(ue_dir, Vec3.lenth(kr_vec)));
  }

  /**
   * 将 ue 坐标转换为 krpano 中的坐标
   * @param ue_pos {Vec3}
   * @param crt_scene {SceneData}
   * @returns {Vec3}
   */
  static ue_pos_to_kr_pos(ue_pos, crt_scene) {
    const ue_vec = Vec3.sub(ue_pos, crt_scene.kr_coord_origin_in_ue);
    const kr_sphere = CoordTools.ue_dir_to_kr_sphere(Vec3.normalize(ue_vec), crt_scene);
    const kr_dir = CoordTools.kr_sphere_to_kr_dir(kr_sphere);

    return Vec3.times(kr_dir, Vec3.lenth(ue_vec));
  }

  /**
   * 根据当前场景中 pos 方向上命中点的法线，计算得到 hotspot 的旋转值
   *
   * 调整旋转值，使得 hotspot 的朝向和法线方向一致
   * @param scene_sphere {[number, number]}
   * @param crt_scene {Scene}
   * @param rotate_angle {number} 额外的旋转角度
   * @return {Vec3}
   */
  static get_hotspot_rotate(scene_sphere, crt_scene, rotate_angle) {
    const norm = CoordTools.get_normal(scene_sphere, crt_scene);

    const N = Vec3.normalize(norm);

    // 因为参考向量是 Up，因此需要排除 Normal = Up 的情况
    let T = Vec3.normalize(Vec3.cross(CoordTools.UP, N));
    if (Math.abs(Math.abs(norm.y) - 1.0) < 0.01) {
      // 这里使用的是 UE_z 作为参考向量，因此是 -camera_yaw
      T = Vec3.normalize(CoordTools.kr_sphere_to_kr_dir([-crt_scene.scene_data.kr_coord_dir_in_ue, 0]));
    }

    let B = Vec3.normalize(Vec3.cross(T, N));

    // 应用旋转角度
    {
      const sin_theta = Math.sin(Tools.deg2rad(rotate_angle));
      const cos_theta = Math.cos(Tools.deg2rad(rotate_angle));
      const T2 = Vec3.add(Vec3.times(T, cos_theta), Vec3.times(B, sin_theta));
      const B2 = Vec3.add(Vec3.times(T, -sin_theta), Vec3.times(B, cos_theta));
      T = Vec3.normalize(T2);
      B = Vec3.normalize(B2);
    }

    const s1 = B.z;

    // beta 的角度仍然无法确定
    const N2_div_safe = Math.max(0.0001, Math.abs(N.z)) * (N.z < 0 ? -1 : 1);
    let beta = Math.atan(T.z / N2_div_safe);
    if (N.z * T.z * beta < 0) {
      beta += Math.PI * (beta < 0 ? 1 : -1);
    }

    const c2 = Math.cos(beta);
    const c2_div_safe = Math.max(0.0001, Math.abs(c2)) * (c2 < 0 ? -1 : 1);
    const c1 = -N.z / c2_div_safe;
    let alpha = Math.acos(Math.max(-1, Math.min(1, c1)));
    if (s1 < 0.0) {
      alpha = -alpha;
    }

    const c1_div_safe = Math.max(0.0001, Math.abs(c1)) * (c1 < 0 ? -1 : 1);
    const s3 = -B.x / c1_div_safe;
    const c3 = B.y / c1_div_safe;
    let gamma = Math.acos(Math.max(-1, Math.min(1, c3)));
    if (s3 < 0.0) {
      gamma = -gamma;
    }

    const rx = Tools.rad2deg(alpha);
    const ry = Tools.rad2deg(beta);
    const rz = Tools.rad2deg(gamma);

    return new Vec3(rx, ry, rz);
  }


  /**
   * 判断在当前场景的 sphere 方向是否命中
   * @param scene_sphere {[number, number]}
   * @param crt_scene {Scene}
   * @return {boolean}
   */
  static hit_test(scene_sphere, crt_scene) {
    if (!crt_scene.depth_image) {
      return false;
    }

    const depth = CoordTools.get_pixel(crt_scene.depth_image, scene_sphere, crt_scene.scene_data)[0];
    return depth < 255;
  }


  /**
   * 某个 ue 坐标是否能够在当前场景被看到
   * @param ue_pos {Vec3}
   * @param crt_scene {Scene}
   * @return {boolean}
   */
  static is_visible_in_current_scene(ue_pos, crt_scene) {
    // 给定点到当前场景相机的距离
    const ue_vec = Vec3.sub(ue_pos, crt_scene.scene_data.cameraPos);
    const dis_to_camera = Vec3.lenth(ue_vec);

    // 根据 global_pos 得到 local_sphere，并判断是否在当前场景的范围内
    const scene_sphere = CoordTools.ue_pos_to_scene_sphere(ue_pos, crt_scene.scene_data);
    const dis_in_depth = CoordTools.get_distance(scene_sphere, crt_scene);

    const ERROR_DISTANCE = 20.0;
    return dis_to_camera < dis_in_depth || dis_to_camera - dis_in_depth < ERROR_DISTANCE;
  }
}


class ProjectData {

  /**
   * 整个场景的最大尺寸
   * @type {number}
   */
  max_extend = 0;

  /**
   * 字典：场景名称-场景
   * @type {Object<string, SceneData>}
   */
  project = {};

  /**
   * 起始的场景
   * @type {SceneData}
   */
  start_scene = undefined;

  #crt_scene = new Scene();

  /**
   * 字典：hotspot名称-hospot
   * @type {Object<string, HotSpotData>}
   */
  hotspot = {};

  /**
   * hotspot 的颜色；用于生成 svg
   * @type {string}
   */
  pivot_color = "";

  /**
   * online interface
   *
   * 记录存档的 region
   * @type {string}
   */
  region = ""; // test, pre, cn2, usa, dev

  /**
   * 存档的版本号
   * @type {[number, number, number]}
   * [major, minor, patch]
   */
  version_num = [2, 8, 1];

  /**
   * 场景切换过程中用到的数据
   * @type {TransData}
   */
  trans_data = new TransData();

  constructor() {}

  /**
   * 初始化项目数据，功能等同于构造函数
   * @param data {IMetaJson}
   */
  load_project_data(data) {
    let scene_array = data.sceneArray;
    /**
     * @type {undefined | SceneData}
     */
    for (let i in scene_array) {
      let scene_name = scene_array[i].sceneName;
      this.project[scene_name] = scene_array[i];

      if (scene_array[i].startScene) {
        this.start_scene = scene_array[i];
      }

      let hotspot_array = scene_array[i].hotspotArray;
      for (let j in hotspot_array) {
        let hotspot_name = hotspot_array[j].hotspotName;
        this.hotspot[hotspot_name] = hotspot_array[j];
      }
    }

    const pivot_color = data.pivotColor;
    this.pivot_color = Tools.color_vec_to_str(
      pivot_color.r,
      pivot_color.g,
      pivot_color.b
    );
    this.region = data.region;
    this.version_num = Version.parse_version_str(data.version);

    this.generate_rude_aabb();
    this.generate_project_data();
  }

  /**
   * 根据基本数据，生成额外的数据
   *
   * 例如场景的相对位置
   *
   * 需要考虑版本兼容
   */
  generate_project_data() {
    if (Version.less_than(this.version_num, [2, 10, 0]))
      // version < 2.10
    {
      // 场景的相对坐标，是相对于自身的
      for (let scene_name in this.project) {
        let scene = this.project[scene_name];
        scene.relativePos = new Vec3(0, 0, 0);
        scene.kr_coord_origin_in_ue = scene.cameraPos;
        scene.kr_coord_dir_in_ue = scene.cameraRotate.x;
      }

      // floor 类型的 hotspot，没有显式 depth 值
      for (let hotspot_name in this.hotspot) {
        let hotspot = this.hotspot[hotspot_name];
        if (hotspot.cameraPointType === ECameraPointType.FLOOR) {
          hotspot.depth = 1000;
        }
      }
    } else
      // version 2.10
    {
      // 场景的相对坐标，是相对于起始场景的
      for (let scene_name in this.project) {
        let scene = this.project[scene_name];
        scene.kr_coord_origin_in_ue = this.start_scene.cameraPos;
        scene.kr_coord_dir_in_ue = this.start_scene.cameraRotate.x;
      }

      // 下面这个函数调用会依赖 kr_coord_origin_in_ue 和 kr_coord_dir_in_ue
      for (let scene_name in this.project) {
        let scene = this.project[scene_name];
        scene.relativePos = CoordTools.ue_pos_to_kr_pos(scene.cameraPos, scene);
      }


      // 为 Fly 类型的 hotspot 重新生成 3D 坐标
      for (let hotspot_name in this.hotspot) {
        let hotspot = this.hotspot[hotspot_name];
        const dst_scene = this.get_scene(hotspot.dstScene);
        const src_scene = this.get_scene(hotspot.srcScene);
        if (!dst_scene || !src_scene || !this.start_scene) {
          continue;
        }

        if (hotspot.cameraPointType === ECameraPointType.FLY) {
          hotspot.hotspot3DCoord = CoordTools.ue_pos_to_kr_pos(dst_scene.cameraPos, src_scene)
          hotspot.depth = 0;
        }
      }
    }
  }

  /**
   * 根据 scene 的名称得到 scene 对象
   *
   * @param scene_name {string}
   * @return {SceneData}
   */
  get_scene(scene_name) {
    return this.project[scene_name];
  }


  /**
   * 获取当前场景
   * @return {Scene}
   */
  get_crt_scene() {
    return this.#crt_scene;
  }

  /**
   * 获取当前场景数据
   * @return {SceneData}
   */
  get_crt_scene_data() {
    return this.#crt_scene.scene_data;
  }

  /**
   * 根据 hotspot 的名称得到 hotspot 对象
   *
   * @param hotspot_name {string}
   * @return {HotSpotData}
   */
  get_hotspot(hotspot_name) {
    return this.hotspot[hotspot_name];
  }

  /**
   * 当前 scene 的所有 hotspots
   * @return {HotSpotData[]}
   */
  current_scene_hotspots() {
    return this.get_crt_scene_data().hotspotArray;
  }

  /**
   * 预先异步加载 depth 和 normal 资源
   * @param krpano {IKrpano}
   * @param dst_scene_obj {SceneData}
   */
  pre_load_scene(krpano, dst_scene_obj) {
    this.#crt_scene.scene_data = dst_scene_obj;
    this.#crt_scene.depth_image = undefined;
    this.#crt_scene.normal_image = undefined;

    // 需要预先加载 image，防止 load scene 时的卡顿
    Tools.load_image(
      dst_scene_obj.depthImageUrl,
      (image) => (this.#crt_scene.depth_image = image)
    );
    Tools.load_image(
      dst_scene_obj.normalImageUrl,
      (image) => (this.#crt_scene.normal_image = image)
    );

    krpano.set("hotspot[mouse_pivot].visible", false);

    this.set_dollhouse_enable(krpano, this.trans_data.dst_scene_mode === EViewMode.DOLLHOUSE);
  }

  /**
   * 更新 is_trans_scene 状态，刷新各个 hotspot 状态
   * @param krpano {IKrpano}
   * @param dst_scene {SceneData}
   */
  post_load_scene(krpano, dst_scene) {
    this.refresh_current_scene_pivot(krpano, dst_scene);

    krpano.set("hotspot[mouse_pivot].visible", true);

    if (this.trans_data.dst_scene_mode === EViewMode.PANOROAM) {
      krpano.control.invert = false;

      krpano.view.fovmin = 40;
      krpano.view.fovmax = 120;

      krpano.control.mousefovchange = 1.0;
    } else if (this.trans_data.dst_scene_mode === EViewMode.DOLLHOUSE) {
      krpano.control.invert = true;

      krpano.view.fovmin = 10;
      krpano.view.fovmax = 170;

      krpano.control.mousefovchange = 0;
    }

    // 没用动画，是从画廊进行的场景切换
    if (!this.trans_data.has_anime) {
      krpano.view.ox = 0;
      krpano.view.oy = 0;
      krpano.view.oz = 0;
      krpano.view.tx = dst_scene.relativePos.x;
      krpano.view.ty = dst_scene.relativePos.y;
      krpano.view.tz = dst_scene.relativePos.z;
      krpano.view.hlookat = dst_scene.cameraRotate.x - dst_scene.kr_coord_dir_in_ue;
    }

    this.trans_data.reset_trans_data();
  }

  /**
   * 刷新当前场景的所有点位的颜色
   * @param krpano {IKrpano}
   * @param scene_obj {SceneData}
   */
  refresh_current_scene_pivot(krpano, scene_obj) {
    for (let i in scene_obj.hotspotArray) {
      const hotspot = scene_obj.hotspotArray[i];
      this.refresh_single_hotspot(krpano, hotspot.hotspotName);
    }
  }

  /**
   *
   * @param krpano {IKrpano}
   * @param hotspot_name {string}
   */
  refresh_single_hotspot(krpano, hotspot_name) {
    const hotspot = this.hotspot[hotspot_name];
    if (!hotspot) {
      return;
    }

    krpano.set(`hotspot[${hotspot_name}].ath`, 0);
    krpano.set(`hotspot[${hotspot_name}].atv`, 0);

    krpano.set(`hotspot[${hotspot_name}].torigin`, "world");
    krpano.set(`hotspot[${hotspot_name}].tx`, hotspot.hotspot3DCoord.x);
    krpano.set(`hotspot[${hotspot_name}].ty`, hotspot.hotspot3DCoord.y);
    krpano.set(`hotspot[${hotspot_name}].tz`, hotspot.hotspot3DCoord.z);
    krpano.set(`hotspot[${hotspot_name}].depth`, hotspot.depth);

    if (hotspot.cameraPointType === ECameraPointType.FLY) {
      krpano.set(`hotspot[${hotspot_name}].distorted`, false);

      krpano.set(`hotspot[${hotspot_name}].rx`, 0);
      krpano.set(`hotspot[${hotspot_name}].ry`, 0);
      krpano.set(
        `hotspot[${hotspot_name}].url`,
        Tools.gen_fly_pivot_url(this.pivot_color)
      );
    } else if (hotspot.cameraPointType === ECameraPointType.FLOOR) {
      krpano.set(`hotspot[${hotspot_name}].distorted`, true);

      krpano.set(`hotspot[${hotspot_name}].rx`, hotspot.hotspotRotate.x);
      krpano.set(`hotspot[${hotspot_name}].ry`, hotspot.hotspotRotate.y);

      krpano.set(
        `hotspot[${hotspot_name}].url`,
        Tools.gen_floor_pivot_url(this.pivot_color)
      );
    }
  }

  /**
   * 基于场景内的所有相机点位，生成粗略的 AABB
   */
  generate_rude_aabb() {
    let min_x = Number.MAX_VALUE;
    let min_y = Number.MAX_VALUE;
    let min_z = Number.MAX_VALUE;

    let max_x = -Number.MAX_VALUE;
    let max_y = -Number.MAX_VALUE;
    let max_z = -Number.MAX_VALUE;

    for (let scene_name in this.project) {
      let scene = this.project[scene_name];
      let camera_pos = scene.cameraPos;
      min_x = Math.min(min_x, camera_pos.x);
      min_y = Math.min(min_y, camera_pos.y);
      min_z = Math.min(min_z, camera_pos.z);
      max_x = Math.max(max_x, camera_pos.x);
      max_y = Math.max(max_y, camera_pos.y);
      max_z = Math.max(max_z, camera_pos.z);
    }

    let max_value = Math.max(max_x - min_x, max_y - min_y, max_z - min_z);
    max_value = Math.max(max_value, 100);

    this.max_extend = max_value;
  }

  /**
   * 根据 AABB 的大小，得到 dollhouse 模式下的缩放速度
   * @return {number}
   */
  get_dollhouse_zoom_speed() {
    return this.max_extend * 0.03;
  }

  /**
   * @param krpano {IKrpano}
   * @param address {string}
   */
  init(krpano, address) {
    fetch((address || "") + "meta.json")
      .then((res) => res.json())
      .then(
        /**
         * @param data {IMetaJson}
         */
        (data) => {
          this.load_project_data(data);

          // modify mouse pivot color
          krpano.set(
            "hotspot[mouse_pivot].url",
            Tools.gen_mouse_pivot_url(this.pivot_color)
          );

          if (this.start_scene) {
            this.pre_load_scene(krpano, this.start_scene);
            this.post_load_scene(krpano, this.start_scene);
          }
        }
      );
  }

  /**
   * @return {string}
   */
  get_region() {
    return this.region;
  }

  /**
   * 从 meta.json 中提取版本号
   * @return {string}
   */
  get_version_str() {
    return `${this.version_num[0]}.${this.version_num[1]}.${this.version_num[2]}`;
  }

  /**
   * @param krpano {IKrpano}
   * @param on_dollhouse_cbk {function(): void} 由外部注入的 cbk，在场景加载完成过后调用
   */
  hook_loadscene(krpano, on_dollhouse_cbk) {
    let origin_loadscene = krpano.actions.loadscene;

    krpano.actions.loadscene = (scenename, vars, flags, blend, loaddone) => {
      let dst_scene = this.get_scene(scenename);

      if (dst_scene) {
        this.pre_load_scene(krpano, dst_scene);
      }

      origin_loadscene(scenename, vars, flags, blend, () => {
        on_dollhouse_cbk();

        this.post_load_scene(krpano, dst_scene);

        if (loaddone) {
          loaddone();
        }
      });
    };
  }

  /**
   * 修改 krpano 的变量，使得 gen.xml 的 if 分支生效
   * @param krpano {IKrpano}
   * @param enable {boolean}
   */
  set_dollhouse_enable(krpano, enable) {
    krpano.dollhouse = enable ? "enable" : "disable";
    this.#crt_scene.view_mode = enable ? EViewMode.DOLLHOUSE : EViewMode.PANOROAM;
  }

  /**
   * 当前场景是否是 dollhouse 模式，和 krpano.dollhouse 保持一致
   * @return {boolean}
   */
  get_is_dollhouse() {
    return this.#crt_scene.view_mode === EViewMode.DOLLHOUSE;
  }

  // TODO：效果可以优化，当相机离开场景中心时
  /**
   * 跳转到最近的点位
   * @param {number} mouse_h
   * @param {number} mouse_v
   * @param krpano {IKrpano}
   */
  jump_to_nearest(mouse_h, mouse_v, krpano) {
    // 鼠标命中位置的方向向量，与当前相机的位置无关，相机可以离开场景中心
    const mouse_kr_dir = CoordTools.kr_sphere_to_kr_dir([mouse_h, mouse_v]);

    const hotspots = this.current_scene_hotspots();

    let min_score = Number.MAX_VALUE;
    let nearest = -1;
    for (let i in hotspots) {
      let hotspot = hotspots[i];
      let hotspot_dir = CoordTools.kr_sphere_to_kr_dir([hotspot.hotspotSphereCoord.x, hotspot.hotspotSphereCoord.y]);
      let cos_theta = Vec3.dot(hotspot_dir, mouse_kr_dir);

      // 跳转到最近位置时，角度阈值
      const NEAREST_ANGLE = 45.0;
      if (cos_theta < Math.cos(Tools.deg2rad(NEAREST_ANGLE))) {
        continue;
      }
      let score = (1.0 - cos_theta) * hotspot.distance;
      if (score < min_score) {
        min_score = score;
        nearest = i;
      }
    }
    if (nearest !== -1) {
      this.trans_action(krpano, hotspots[nearest].hotspotName);
    }
  }

  /**
   * 点击事件
   * @param krpano {IKrpano}
   */
  on_click(krpano) {
    let [mouse_h, mouse_v] = CoordTools.get_mouse_sphere(krpano);
    this.jump_to_nearest(mouse_h, mouse_v, krpano);
  }

  /**
   * 转场动画
   * @param krpano {IKrpano}
   * @param hotspot_name {string}
   */
  trans_action(krpano, hotspot_name) {
    this.hide_scene_hotpsot(krpano, this.#crt_scene.scene_data);

    const hotspot = this.get_hotspot(hotspot_name);

    krpano.control.invert = false;

    this.trans_data.prepare_trans_data(true, this.get_crt_scene(), EViewMode.PANOROAM);

    if (Version.less_than(this.version_num, [2, 10, 0])) {
      this.trans_anime_depth(krpano, hotspot_name, () => {
      });
    } else {
      if (this.trans_data.src_scene_mode === EViewMode.DOLLHOUSE) {
        this.trans_anime_doll2pano(krpano, this.get_scene(hotspot.dstScene));
      } else if (this.trans_data.src_scene_mode === EViewMode.PANOROAM) {
        this.trans_anime_3dtrans_pano2pano(krpano, hotspot_name, () => {
        });
      }
    }
  }

  /**
   * 切换到 dollhouse 的模式
   * @param krpano {IKrpano}
   * @param dst_scene {SceneData}
   */
  trans_anime_pano2doll(krpano, dst_scene) {
    const old_hlookat = krpano.view.hlookat;

    krpano.actions.loadscene(
      dst_scene.sceneName,
      null,
      "MERGE",
      "BLEND(0.3)",
      () => {
        krpano.actions.tween(
          "view.tx|view.ty|view.tz|view.hlookat|view.vlookat|view.fov|view.oz",
          `${dst_scene.relativePos.x}|${dst_scene.relativePos.y}|${dst_scene.relativePos.z}|${old_hlookat}|35|80|1000`,
          2,
          "easeinsine",
          () => {
          }
        );
      }
    );
  }

  /**
   * 切换到 panorama 的显示模式
   * @param krpano {IKrpano}
   * @param dst_scene {SceneData}
   */
  trans_anime_doll2pano(krpano, dst_scene) {
    const tween_vars = "view.tx|view.ty|view.tz|view.ox|view.oy|view.oz";
    const tween_vals = `${dst_scene.relativePos.x}|${dst_scene.relativePos.y}|${dst_scene.relativePos.z}|0|0|0`;
    krpano.actions.tween(tween_vars, tween_vals, 2, "", () => {
        krpano.actions.loadscene(dst_scene.sceneName, null, "MERGE", "BLEND(0.3)"
        );
      }
    );
  }

  /**
   * 转场动画: 基于 depthmap
   * @param krpano {IKrpano}
   * @param hotspot_name {string}
   * @param cbk {function(): void}
   */
  trans_anime_depth(krpano, hotspot_name, cbk) {
    const hotspot = this.get_hotspot(hotspot_name);
    const src_scene = this.get_scene(hotspot.srcScene);
    const dst_scene = this.get_scene(hotspot.dstScene);

    const [cur_h, cur_v] = [
      krpano.get("view.hlookat"),
      krpano.get("view.vlookat"),
    ];
    const dst_h = cur_h + src_scene.cameraRotate.x - dst_scene.cameraRotate.x;
    const dst_v = cur_v;

    let dst_scene_pos = CoordTools.ue_pos_to_kr_pos(dst_scene.cameraPos, src_scene);
    const tween_time = 1.0;

    const tween_src_scene = (cbk) => krpano.actions.tween(
      "view.tx|view.ty|view.tz|view.ox|view.oy|view.oz",
      `${dst_scene_pos.x}|${dst_scene_pos.y}|${dst_scene_pos.z}|0|0|0`,
      tween_time,
      "easeinoutsine", cbk
    );

    const tween_dst_scene = (cbk) => {
      krpano.view.tx = 0;
      krpano.view.ty = 0;
      krpano.view.tz = 0;

      krpano.actions.tween(
        "view.hlookat|view.vlookat",
        `${dst_h}|${dst_v}`,
        0.0,
        "",
        cbk
      );
    };

    tween_src_scene(() => krpano.actions.loadscene(
      hotspot.dstScene,
      "null",
      "MERGE",
      `BLEND(0.5)`,
      tween_dst_scene
    ));
  }

  /**
   * 转场动画: 基于 krpano 的 3dtrasition()
   *
   * 只适于从 panoroam 的 viewmode 到 panoroam
   * @param krpano {IKrpano}
   * @param hotspot_name {string}
   * @param cbk {function(): void}
   */
  trans_anime_3dtrans_pano2pano(krpano, hotspot_name, cbk) {
    const hotspot = this.get_hotspot(hotspot_name);
    const dst_scene = this.get_scene(hotspot.dstScene);

    const blur = 0;
    const hlookatoffset = 0;
    const delay = 0;
    const tween_time = 1.0;

    krpano.actions.set3dtransition("world", dst_scene.relativePos.x, dst_scene.relativePos.y, dst_scene.relativePos.z, blur, hlookatoffset, delay, tween_time, "easeinoutsine");
    krpano.actions.loadscene(hotspot.dstScene, "null", "MERGE", "BLEND(0.5)", cbk);
  }

  /**
   * 隐藏当前场景的所有 hotspot
   * @param krpano {IKrpano}
   * @param scene_obj {SceneData}
   */
  hide_scene_hotpsot(krpano, scene_obj) {
    const current_scene_hotspots = scene_obj.hotspotArray;
    for (let hotspot_index in current_scene_hotspots) {
      const hotspot_name = current_scene_hotspots[hotspot_index].hotspotName;
      krpano.set(`hotspot[${hotspot_name}].visible`, false);
    }
  }

  /**
   * type: 1-> Floor, 2-> Fly
   * @param krpano {IKrpano}
   * @param scene_name {string}
   * @param type {number}
   */
  change_camera_point_type(krpano, scene_name, type) {
    for (let i in this.hotspot) {
      const hotspot = this.hotspot[i];
      if (hotspot.dstScene === scene_name) {
        this.change_camera_point_type_single_hostpot(
          krpano,
          hotspot.hotspotName,
          type
        );
      }
    }
  }

  /**
   *
   * @param krpano {IKrpano}
   * @param hotspot_name {string}
   * @param type {number}
   */
  change_camera_point_type_single_hostpot(krpano, hotspot_name, type) {
    let hotspot = this.get_hotspot(hotspot_name);
    if (!hotspot) {
      return;
    }

    if (type === 1) {
      hotspot.cameraPointType = ECameraPointType.FLOOR;
    } else if (type === 2) {
      hotspot.cameraPointType = ECameraPointType.FLY;
    }
    this.refresh_single_hotspot(krpano, hotspot_name);
  }

  /**
   * 更新鼠标位置的点位
   * @param krpano {IKrpano}
   */
  tick(krpano) {
    // 在场景切换的动画中，不更新 mouse pivot
    if (!this.trans_data.has_anime) {
      this.update_mouse_pivot(krpano);
    }
  }

  /**
   * 查询法线图和深度图，更新鼠标 pivot 样式
   * @param krpano {IKrpano}
   */
  update_mouse_pivot(krpano) {
    if (krpano.device.mobile) {
      krpano.set("hotspot[mouse_pivot].visible", false);
      return;
    }

    if (this.has_moved(krpano)) {
      krpano.set("hotspot[mouse_pivot].visible", false);
      return;
    }

    if (!this.#crt_scene.depth_image.data || !this.#crt_scene.normal_image.data) {
      return;
    }

    const mouse_kr_sphere = CoordTools.get_mouse_sphere(krpano);
    if (!CoordTools.hit_test(mouse_kr_sphere, this.#crt_scene) && !CoordTools.is_normal_valid(mouse_kr_sphere, this.#crt_scene)) {
      krpano.set("hotspot[mouse_pivot].visible", false);
      return;
    } else {
      krpano.set("hotspot[mouse_pivot].visible", true);
    }

    const hit_kr_pos = CoordTools.get_hit_kr_pos(mouse_kr_sphere, this.#crt_scene);
    const hotspot_kr_pos = new Vec3(hit_kr_pos.x, hit_kr_pos.y, hit_kr_pos.z);

    krpano.set("hotspot[mouse_pivot].tx", hotspot_kr_pos.x);
    krpano.set("hotspot[mouse_pivot].ty", hotspot_kr_pos.y);
    krpano.set("hotspot[mouse_pivot].tz", hotspot_kr_pos.z);
    krpano.set("hotspot[mouse_pivot].depth", 0);

    const rotate = CoordTools.get_hotspot_rotate(mouse_kr_sphere, this.#crt_scene, 0);
    krpano.set("hotspot[mouse_pivot].rx", rotate.x);
    krpano.set("hotspot[mouse_pivot].ry", rotate.y);
    krpano.set("hotspot[mouse_pivot].rz", rotate.z);
  }

  /**
   * 通过 tx, ty, tz, ox, oy, oz 来判断当前的 view 是否发生了移动
   * @param krpano {IKrpano}
   * @return {boolean}
   */
  has_moved(krpano) {
    const view = krpano.view;
    const crt_scene_pos = this.#crt_scene.scene_data.relativePos;
    return (
      !Tools.nearly_equal(view.tx, crt_scene_pos.x) ||
      !Tools.nearly_equal(view.ty, crt_scene_pos.y) ||
      !Tools.nearly_equal(view.tz, crt_scene_pos.z) ||
      !Tools.nearly_equal(view.ox, 0) ||
      !Tools.nearly_equal(view.oy, 0) ||
      !Tools.nearly_equal(view.oz, 0)
    );
  }

  // TODO 相机离开场景中心时，可以优化一下
  /**
   * @param krpano {IKrpano}
   * @param keyboard {Keyboard}
   */
  jump_control(krpano, keyboard) {
    let target_h = 0;
    const target_v = krpano.view.vlookat;
    const current_h = krpano.view.hlookat;
    if (keyboard.key_w) // front
    {
      target_h = current_h;
    } else if (keyboard.key_a)  // left
    {
      target_h = Tools.clamp_angle(current_h - 90, 0)[0];
    } else if (keyboard.key_s)  // back
    {
      target_h = Tools.clamp_angle(current_h + 180, 0)[0];
    } else if (keyboard.key_d) // right
    {
      target_h = Tools.clamp_angle(current_h + 90, 0)[0];
    }

    this.jump_to_nearest(target_h, target_v, krpano);
  }

  /**
   * @param krpano {IKrpano}
   */
  on_newscene(krpano) {}
}


/**
 * - action interface: 给 d5.xml 的一系列 <action> 提供的方法，以及注册到 krpano event 的方法
 * - online interface: 给在线浏览提供的接口
 * - plugin interface: 插件调用的方法或者由插件注入的方法
 */
class D5 {
  /**
   * @type {IKrpano}
   */
  krpano = undefined;

  /**
   * online interface
   *
   * 由服务端注入
   *
   * 用于区分本地浏览和服务器浏览
   * @type {string}
   */
  address = "";

  keyboard = new Keyboard();

  project_data = new ProjectData();

  /**
   * @type {DollhouseControl}
   */
  dollhouse_control = undefined;

  constructor() {
    this.dollhouse_control = new DollhouseControl(this.project_data, this.keyboard);
  }

  /**
   * online interface
   * @param image_url {string}
   * @param cbk {function(ImageData): void}
   */
  load_image(image_url, cbk) {
    Tools.load_image(image_url, cbk);
  }

  /**
   * online interface
   * @param global_pos {[number, number, number]}
   * @return {boolean}
   */
  is_visible_in_current_scene(global_pos) {
    return CoordTools.is_visible_in_current_scene(Vec3.from_array(global_pos), this.project_data.get_crt_scene());
  }

  /**
   * online interface
   * @param local_sphere_coord {[number, number]}
   * @return {boolean}
   */
  hit_test(local_sphere_coord) {
    return CoordTools.hit_test(local_sphere_coord, this.project_data.get_crt_scene());
  }

  /**
   * online interface
   * @param screen_coord {[number, number]}
   * @return {[number, number]}
   */
  screen_coord_to_local_sphere_coord(screen_coord) {
    return CoordTools.screen_coord_to_kr_sphere(this.krpano, screen_coord);
  }

  /**
   * online interface
   * @param local_sphere_coord {[number, number]}
   * @return {[number, number, number]}
   */
  local_sphere_to_local_pos(local_sphere_coord) {
    const hit_kr_pos = CoordTools.get_hit_kr_pos(local_sphere_coord, this.project_data.get_crt_scene());
    return [hit_kr_pos.x, hit_kr_pos.y, hit_kr_pos.z - 1000];
  }

  /**
   * online interface
   * @param local_pos {[number, number, number]}
   * @return {[number, number]}
   */
  local_pos_to_local_sphere_coord(local_pos) {
    const kr_pos = new Vec3(local_pos[0], local_pos[1], local_pos[2] + 1000);
    return CoordTools.kr_pos_to_scene_sphere(kr_pos, this.project_data.get_crt_scene_data());
  }

  /**
   * online interface
   * @param local_pos {[number, number, number]}
   * @return {[number, number, number]}
   */
  local_pos_to_global_pos(local_pos) {
    const kr_pos = new Vec3(local_pos[0], local_pos[1], local_pos[2] + 1000);
    return Vec3.to_array(CoordTools.kr_pos_to_ue_pos(kr_pos, this.project_data.get_crt_scene_data()));
  }

  /**
   * online interface
   * @type {function([number, number, number]): [number, number, number]}
   * @param global_pos {[number, number, number]}
   * @return {[number, number, number]}
   */
  global_pos_to_local_pos(global_pos) {
    const ue_pos = Vec3.from_array(global_pos);
    const kr_pos = CoordTools.ue_pos_to_kr_pos(ue_pos, this.project_data.get_crt_scene_data());
    return [kr_pos.x, kr_pos.y, kr_pos.z - 1000];
  }

  /**
   * online interface
   * @param local_pos {[number, number, number]}
   * @param rotate_angle {number}
   * @return {[number, number, number]}
   */
  get_hotspot_rotate(local_pos, rotate_angle = 0) {
    const kr_pos = new Vec3(local_pos[0], local_pos[1], local_pos[2] + 1000);

    let clamped_rotate_angle = rotate_angle;
    {
      const temp = (clamped_rotate_angle + 1800) % 90;
      if (temp < 0.3 || temp > 89.7) {
        clamped_rotate_angle += 0.5;
      }
    }

    const scene_sphere = CoordTools.kr_pos_to_scene_sphere(kr_pos, this.project_data.get_crt_scene_data());
    const hotspot_rotate = CoordTools.get_hotspot_rotate(scene_sphere, this.project_data.get_crt_scene(), clamped_rotate_angle);

    return Vec3.to_array(hotspot_rotate);
  }

  /**
   * online interface
   * @type {function(): string}
   * @return {string}
   */
  get_region() {
    return this.project_data.get_region();
  }

  /**
   * online interface
   * @param scene_name {string}
   * @param type {number}
   */
  change_camera_point_type(scene_name, type) {
    this.project_data.change_camera_point_type(this.krpano, scene_name, type);
  }

  // TODO 这个有用吗
  /**
   * online interface
   *
   * 2.10 版本改变了坐标系，需要更新 local pos
   * @param old_local_pos {Vec3}
   * @param scene_data {SceneData}
   * @return {Vec3}
   */
  local_pos_update_210(old_local_pos, scene_data) {
    // 旧的局部坐标系的 x 轴，在新的基于 start scene 的坐标系中的向量表示
    const old_z = CoordTools.kr_sphere_to_kr_dir([scene_data.cameraRotate.x - scene_data.kr_coord_dir_in_ue, 0]);
    const old_x = CoordTools.kr_sphere_to_kr_dir([scene_data.cameraRotate.x - scene_data.kr_coord_dir_in_ue + 90, 0]);

    let new_pos = Vec3.add(Vec3.times(old_z, old_local_pos.z), Vec3.times(old_x, old_local_pos.x));
    new_pos = Vec3.add(new_pos, new Vec3(0, old_local_pos.y, 0));
    new_pos = Vec3.add(new_pos, scene_data.relativePos);
    return new_pos;
  }

  /**
   * online interface
   * @return {string}
   */
  get_version() {
    return this.project_data.get_version_str();
  }

  /**
   * action interface
   * @param krpano {IKrpano}
   */
  on_init(krpano) {
    this.krpano = krpano;

    krpano.set("view.fovtype", "HFOV");

    this.project_data.hook_loadscene(krpano, () => {
      if (this.on_dollhouse) this.on_dollhouse();
    });
    this.project_data.init(krpano, this.address);

    this.dollhouse_control.walk_control(krpano);
  }

  /**
   * action interface
   * @param krpano {IKrpano}
   * @param hotspot_name {string}
   */
  trans_action(krpano, hotspot_name) {
    this.project_data.trans_action(krpano, hotspot_name);
  }

  /**
   * action interface
   * @param krpano {IKrpano}
   */
  on_click(krpano) {
    this.project_data.on_click(krpano);
  }

  /**
   * action interface
   * @type {function(IKrpano): void}
   * @param krpano {IKrpano}
   */
  on_frame(krpano) {
    this.project_data.tick(krpano);
  }

  /**
   * action interface
   * @param krpano {IKrpano}
   */
  on_keyup(krpano) {
    this.keyboard.update_key_status(krpano, false);
  }

  /**
   * action interface
   * @param krpano {IKrpano}
   */
  on_keydown(krpano) {
    this.keyboard.update_key_status(krpano, true);

    if (this.keyboard.key_c) {
      this.dh_view();
    } else if (this.keyboard.key_b) {
      this.reset_view();
    }

    // 使用键盘跳转的功能仅 2.8 有，后续去掉了
    if (Version.equal(this.project_data.version_num, [2, 8, 0])) {
      this.project_data.jump_control(krpano, this.keyboard);
    }
  }

  /**
   * action interface
   * @param krpano {IKrpano}
   */
  on_resize(krpano) {
    const width = krpano.get("stagewidth");
    const height = krpano.get("stageheight");

    if (width > height) {
      krpano.set("view.fovtype", "HFOV");
    } else {
      krpano.set("view.fovtype", "VFOV");
    }
  }

  /**
   * action interface
   * @param krpano {IKrpano}
   */
  on_newscene(krpano) {
    this.project_data.on_newscene(krpano);
  }

  /**
   * action interface
   * @param krpano {IKrpano}
   */
  on_wheel(krpano) {
    this.keyboard.update_mouse_status(krpano);
  }


  /**
   * plugin interface
   */
  dh_view() {
    this.project_data.trans_data.prepare_trans_data(true, this.project_data.get_crt_scene(), EViewMode.DOLLHOUSE);
    this.project_data.trans_anime_pano2doll(this.krpano, this.project_data.get_crt_scene_data());
  }

  /**
   * plugin interface
   */
  reset_view() {
    this.project_data.trans_data.prepare_trans_data(true, this.project_data.get_crt_scene(), EViewMode.PANOROAM);
    this.project_data.trans_anime_doll2pano(this.krpano, this.project_data.get_crt_scene_data());
  }

  /**
   * plugin interface
   * 交给外部实现，会在 dollhouse 模式切换时被调用
   * @type {function(): void}
   */
  on_dollhouse = undefined;

  /**
   * debug interface
   */
  debug_view() {
    const view = this.krpano.view;

    console.log("view.tx", view.tx);
    console.log("view.ty", view.ty);
    console.log("view.tz", view.tz);

    console.log("view.ox", view.ox);
    console.log("view.oy", view.oy);
    console.log("view.oz", view.oz);

    console.log("view.hlookat", view.hlookat);
    console.log("view.vlookat", view.vlookat);
    console.log("view.fov", view.fov);
  }

  /**
   * 测试坐标系转换
   */
  test_coord() {
    const kr_pos = new Vec3(123, 456, 789);
    const cal_ue_pos = CoordTools.kr_pos_to_ue_pos(kr_pos, this.project_data.get_crt_scene_data());
    const cal_kr_pos = CoordTools.ue_pos_to_kr_pos(cal_ue_pos, this.project_data.get_crt_scene_data());

    console.log("origin kr pos: ", kr_pos);
    console.log("cal ue pos: ", cal_ue_pos);
    console.log("cal kr pos: ", cal_kr_pos);
  }
}


/**
 * @type {D5}
 */
let d5 = new D5();

const __action_interface__ = [
  d5.trans_action,
  d5.on_init,
  d5.on_click,
  d5.on_frame,
  d5.on_keyup,
  d5.on_keydown,
  d5.on_resize,
  d5.on_newscene,
  d5.on_wheel,
];

const __degug_interface__ = [
  d5.debug_view,
  d5.test_coord,
];

const __plugin_interface__ = [
  d5.reset_view,
  d5.on_dollhouse,
  d5.dh_view,
];

const __online_interface__ = [
  d5.load_image,
  d5.is_visible_in_current_scene,
  d5.hit_test,
  d5.screen_coord_to_local_sphere_coord,
  d5.local_sphere_to_local_pos,
  d5.local_pos_to_local_sphere_coord,
  d5.local_pos_to_global_pos,
  d5.global_pos_to_local_pos,
  d5.get_hotspot_rotate,
  d5.get_region,
  d5.change_camera_point_type,
  d5.get_version,
  d5.local_pos_update_210,
];
