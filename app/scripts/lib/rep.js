!function() {
  var rep = {
    version: "0.1.0"
  };
  "use strict";
  rep.crp = function() {
    var data = null, rpdata = null, rpdataDirty = true, rpimage = null, buf = null, buf8 = null, data32 = null, canvas = null, canvasOffScreen = null, offScreenDirty = true, ctx = null, ctxOffScreen = null, eps = .5, distfn = rep.norms.l2, width = 100, height = 100, xScale, yScale, imgWidth, imgHeight, activeDomain, epsnet;
    function initArray(a, val) {
      var n = a.length, i = 0;
      for (;i < n; ++i) a[i] = val;
    }
    function initData(d) {
      var s = imgWidth * imgHeight;
      data = d;
      rpdata = new Float32Array(s);
      activeDomain = new Uint8Array(imgWidth);
      epsnet = new Uint8Array(imgWidth);
      rpdataDirty = true;
      buf = new ArrayBuffer(s * 4);
      buf8 = new Uint8ClampedArray(buf);
      data32 = new Uint32Array(buf);
      ctx.globalCompositeOperation = "source-over";
      ctx.imageSmoothingEnabled = false;
      ctxOffScreen.imageSmoothingEnabled = false;
      rpimage = ctxOffScreen.getImageData(0, 0, imgWidth, imgHeight);
    }
    function crp(s, d) {
      imgWidth = d.x.length;
      imgHeight = d.y.length;
      canvasOffScreen = document.createElement("canvas");
      canvasOffScreen.width = imgWidth;
      canvasOffScreen.height = imgHeight;
      ctxOffScreen = canvasOffScreen.getContext("2d");
      canvas = s.append("canvas").attr("width", width).attr("height", height).node();
      ctx = canvas.getContext("2d");
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
      initData(d);
      initScale();
      update();
      return crp;
    }
    function renderOffScreen() {
      rpimage.data.set(buf8);
      ctxOffScreen.putImageData(rpimage, 0, 0);
      offScreenDirty = false;
    }
    function updateRP() {
      rpdata = rep_rp(rpdata, data, distfn);
      initArray(epsnet, 0);
      rep.toimg(rpdata, data32, imgWidth, imgHeight, eps, epsnet);
      rpdataDirty = false;
      offScreenDirty = true;
    }
    function update() {
      if (rpdataDirty === true) updateRP();
      if (offScreenDirty === true) renderOffScreen();
      var dx = xScale.domain(), rx = xScale.range(), dy = yScale.domain(), ry = yScale.range();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(canvasOffScreen, dx[0], dy[0], dx[1] - dx[0], dy[1] - dy[0], rx[0], ry[0], rx[1] - rx[0], ry[1] - ry[0]);
    }
    function initScale() {
      xScale = d3.scale.linear().domain([ 0, imgWidth ]).range([ 0, width ]);
      yScale = d3.scale.linear().domain([ 0, imgHeight ]).range([ 0, height ]);
    }
    crp.rqa = function() {
      if (rpdata) return rep.rqa(rpdata, data.x.length, eps);
    };
    crp.epsnet = function() {
      return epsnet;
    };
    crp.patternHighlight = function(p) {
      offScreenDirty = true;
      if (!(arguments.length && p)) {
        update();
        return activeDomain;
      }
      initArray(activeDomain, 0);
      var d = data32, rp = rpdata, b = [ 255, 0, 0 ], s1, s2, f, v;
      for (var i = 0; i < imgHeight - 1; i++) {
        for (var j = i + 1; j < imgWidth; j++) {
          s1 = imgWidth * i + j;
          s2 = imgWidth * j + i;
          v = rp[s1] <= eps ? 255 : 0;
          f = p[s1] === 2;
          if (f) activeDomain[j] = activeDomain[i] = 1;
          d[s1] = f ? 255 << 24 | .5 * (v + b[2]) << 16 | .5 * (v + b[1]) << 8 | .5 * (v + b[0]) : 255 << 24 | v << 16 | v << 8 | v;
          d[s2] = d[s1];
        }
      }
      update();
      return activeDomain;
    };
    crp.resetHighlight = function() {
      offScreenDirty = true;
      initArray(activeDomain, 0);
      rep.toimg(rpdata, data32, imgWidth, imgHeight, eps, epsnet);
      update();
      return activeDomain;
    };
    crp.boxHighlight = function(e) {
      offScreenDirty = true;
      if (!arguments.length) {
        update();
        return activeDomain;
      }
      initArray(activeDomain, 0);
      var startX = e[0][0] - .5, startY = e[0][1] - .5, endX = e[1][0] - .5, endY = e[1][1] - .5, d = data32, rp = rpdata, b = [ 255, 0, 0 ], s1, f, v, i, j;
      for (i = 0; i < imgHeight; i++) {
        for (j = 0; j < imgWidth; j++) {
          s1 = imgWidth * i + j;
          v = rp[s1] <= eps ? 255 : 0;
          f = !(i < startY || i > endY || j < startX || j > endX);
          if (f) activeDomain[j] = activeDomain[i] = 1;
          d[s1] = f === true ? 255 << 24 | .5 * (v + b[2]) << 16 | .5 * (v + b[1]) << 8 | .5 * (v + b[0]) : 255 << 24 | v << 16 | v << 8 | v;
        }
      }
      update();
      return activeDomain;
    };
    crp.update = function() {
      if (data !== null) update();
      return crp;
    };
    crp.distfn = function(_) {
      if (!arguments.length) return distfn;
      var t = typeof _;
      if (t === "string") {
        distfn = rep.norms[_] !== "undefined" ? rep.norms[_] : rep.norms.l2;
        rpdataDirty = true;
      } else if (t === "function") {
        distfn = _;
        rpdataDirty = true;
      } else {
        console.warn("Incorrect form of the distance function!");
        console.warn("Reverting back to the default, Euclidean distance");
      }
      return crp;
    };
    crp.eps = function(_) {
      if (!arguments.length) return eps;
      eps = +_;
      rpdataDirty = true;
      return crp;
    };
    crp.width = function(_) {
      if (!arguments.length) return width;
      width = +_;
      return crp;
    };
    crp.height = function(_) {
      if (!arguments.length) return height;
      height = +_;
      return crp;
    };
    crp.scale = function(_) {
      if (!arguments.length) return {
        xs: xScale,
        ys: yScale
      };
      xScale = _.xs();
      yScale = _.ys();
      return crp;
    };
    crp.distanceMatrix = function() {
      return rpdata;
    };
    crp.data = function(_) {
      if (!arguments.length) return data;
      imgWidth = _.x.length;
      imgHeight = _.y.length;
      ctxOffScreen.clearRect(0, 0, canvasOffScreen.width, canvasOffScreen.height);
      canvasOffScreen.width = imgWidth;
      canvasOffScreen.height = imgHeight;
      initData(_);
      return crp;
    };
    crp.highlight = function(_) {
      offScreenDirty = true;
      if (!(arguments.length && _)) {
        update();
        return;
      }
      var d = data32, rp = rpdata, b = [ 255, 0, 0 ], s1, s2, f, v;
      for (var i = 0; i < imgHeight; i++) {
        for (var j = i; j < imgWidth; j++) {
          s1 = imgWidth * i + j;
          s2 = imgWidth * j + i;
          v = rp[s1] <= eps ? 255 : 0;
          f = _[i] === 1 && _[j] === 1;
          d[s1] = f === true ? 255 << 24 | .5 * (v + b[2]) << 16 | .5 * (v + b[1]) << 8 | .5 * (v + b[0]) : 255 << 24 | v << 16 | v << 8 | v;
          d[s2] = d[s1];
        }
      }
      update();
    };
    return crp;
  };
  function rep_rp(a, d, func) {
    var x = d.x, y = d.y, n = x.length, m = y.length, i, j;
    for (i = 0; i < m; i++) for (j = 0; j < n; j++) a[n * i + j] = func(x[i], y[j]);
    return a;
  }
  rep.toimg = function(data, img, w, h, eps, epsnet) {
    var i, j, k, k2, v;
    for (i = 0; i < h - 1; i++) {
      img[i * w + i] = 255 << 24 | 255 << 16 | 255 << 8 | 255;
      for (j = i + 1; j < w; j++) {
        k = i * w + j;
        v = data[k] <= eps ? 255 : 0;
        if (v > 0) {
          epsnet[i] = 1;
          epsnet[j] = 1;
        }
        img[k] = 255 << 24 | v << 16 | v << 8 | v;
        k2 = j * w + i;
        img[k2] = img[k];
      }
    }
    img[i * w + i] = 255 << 24 | 255 << 16 | 255 << 8 | 255;
  };
  rep.norms = {
    l1: rep_dist_l1,
    l2: rep_dist_l2,
    max: rep_dist_max,
    min: rep_dist_min,
    edit: rep_dist_edit
  };
  function rep_dist_l1(a, b) {
    if (typeof a === "number") return Math.abs(a - b);
    var n = a.length, s = 0, i;
    for (i = 0; i < n; i++) s += Math.abs(a[i] - b[i]);
    return s;
  }
  function rep_dist_l2(a, b) {
    if (typeof a === "number") return Math.abs(a - b);
    var n = a.length, s = 0, i;
    for (i = 0; i < n; i++) s += (a[i] - b[i]) * (a[i] - b[i]);
    return Math.sqrt(s);
  }
  function rep_dist_max(a, b) {
    if (typeof a === "number") return Math.abs(a - b);
    var n = a.length, s = [], i;
    for (i = 0; i < n; i++) s.push(Math.abs(a[i] - b[i]));
    return Math.max.apply(null, s);
  }
  function rep_dist_min(a, b) {
    if (typeof a === "number") return Math.abs(a - b);
    var n = a.length, s = [], i;
    for (i = 0; i < n; i++) s.push(Math.abs(a[i] - b[i]));
    return Math.min.apply(null, s);
  }
  function rep_dist_edit(a, b) {
    var n = a.length, s = 0, i;
    for (i = 0; i < n; i++) s += a[i] === b[i] ? 0 : 1;
    return s;
  }
  rep.rqa = function(d, n, eps) {
    var dlmin = 1, vlmin = 1, dl = rep_distanceToRP(d, eps), rc = rep_rc(dl, n), vl = stat.uint8ArrayCopy(dl), hl = stat.uint8ArrayCopy(dl), histdl = rep_diagonalLineHistogram(dl, n), histvl = rep_verticalLineHistogram(vl, n), histhl = rep_horizontalLineHistogram(hl, n), rectCounts = rep_countRects(stat.uint8ArrayCopy(dl), n, 10, 10), rr = 2 * rc / (n * n - n), Sdlmin = 0, Svlmin = 0, Zdl = 0, Zvl = 0, i, p, det, entropy, l, lmax, lam, tt, vmax;
    for (i = 0; i < n; i++) {
      if (i < dlmin) Sdlmin += (i + 1) * histdl[i]; else Zdl += histdl[i];
    }
    for (i = 0; i < n; i++) {
      if (i < vlmin) Svlmin += (i + 1) * histvl[i]; else Zvl += histvl[i];
    }
    det = rc ? (rc - Sdlmin) / rc : 0;
    lam = rc ? (rc - Svlmin) / rc : 0;
    l = Zdl ? (rc - Sdlmin) / Zdl : 0;
    tt = Zvl ? (rc - Svlmin) / Zvl : 0;
    lmax = rep_histMax(histdl);
    vmax = rep_histMax(histvl);
    var h = 0;
    for (i = dlmin; i < n; i++) {
      p = histdl[i];
      if (p > 0) h += p / Zdl * Math.log(p / Zdl);
    }
    entropy = -h;
    return {
      rr: rr,
      det: det,
      entropy: entropy,
      l: l,
      lmax: lmax,
      lam: lam,
      tt: tt,
      vmax: vmax,
      dl: dl,
      vl: vl,
      hl: hl,
      dsq: rectCounts.dsq / (2 * rc),
      odr: rectCounts.odr / (2 * rc)
    };
  };
  rep.rr = function(d, n, eps) {
    var rp = rep_distanceToRP(d, eps);
    return rep_rc(rp, n) / (n * n - n);
  };
  rep.det = function(d, n, eps) {
    var rp = rep_distanceToRP(d, eps), histdl = rep_diagonalLineHistogram(rp, n), rc = rep_rc(rp, n);
    return (rc - 2 * histdl[0]) / rc;
  };
  rep.entropy = function(d, n, eps) {
    var rp = rep_distanceToRP(d, eps), histdl = rep_diagonalLineHistogram(rp, n), z = 0, lmin = 2, i = lmin - 1, h = 0, p;
    for (;i < histdl.length; i++) z += histdl[i];
    for (i = lmin - 1; i < histdl.length; i++) {
      p = histdl[i];
      if (p > 0) h += p / z * Math.log(p / z);
    }
    return -h;
  };
  var rep_histMax = function(h) {
    var n = h.length, i;
    for (i = n - 1; i >= 0; i--) if (h[i]) return i + 1;
  };
  var rep_rc = function(rp, n) {
    var s = 0, i, j;
    for (i = 0; i < n - 1; i++) for (j = i + 1; j < n; j++) s += rp[i * n + j];
    return s;
  };
  var rep_diagonalLineHistogram = function(rp, n) {
    var h = stat.uint32Array(n, 0), cnt, i, j, indx;
    for (i = 0; i < n - 1; i++) {
      for (j = i + 1; j < n; j++) {
        indx = i * n + j;
        if (rp[indx] === 1) {
          rp[indx] = 0;
          cnt = 1;
          cnt += rep_traceDiagonal(rp, i + 1, j + 1, n);
          rp[indx] = cnt > 1 ? 2 : 0;
          h[cnt - 1]++;
        }
      }
    }
    return h;
  };
  var rep_verticalLineHistogram = function(rp, n) {
    var h = stat.uint32Array(n, 0), cnt, i, j, indx;
    for (i = 0; i < n - 1; i++) {
      for (j = i + 1; j < n; j++) {
        indx = i * n + j;
        if (rp[indx] === 1) {
          rp[indx] = 0;
          cnt = 1;
          cnt += rep_traceVertical(rp, i + 1, j, n);
          rp[indx] = cnt > 1 ? 2 : 0;
          h[cnt - 1]++;
        }
      }
    }
    return h;
  };
  var rep_horizontalLineHistogram = function(rp, n) {
    var h = stat.uint32Array(n, 0), cnt, i, j, indx;
    for (i = 0; i < n - 1; i++) {
      for (j = i + 1; j < n; j++) {
        indx = i * n + j;
        if (rp[indx] === 1) {
          cnt = 1;
          rp[indx] = 0;
          cnt += rep_traceHorizontal(rp, i, j + 1, n);
          rp[indx] = cnt > 1 ? 2 : 0;
          h[cnt - 1]++;
        }
      }
    }
    return h;
  };
  var rep_traceHorizontal = function(rp, i, j, n) {
    var m = n - j, cnt = 0, l = 0, indx;
    for (;l < m; l++, j++) {
      indx = i * n + j;
      if (rp[indx] === 1) {
        cnt++;
        rp[indx] = 2;
      } else {
        break;
      }
    }
    return cnt;
  };
  var rep_traceVertical = function(rp, i, j, n) {
    var m = j - i, cnt = 0, l, indx;
    for (l = 0; l < m; l++, i++) {
      indx = i * n + j;
      if (rp[indx] === 1) {
        cnt++;
        rp[indx] = 2;
      } else {
        break;
      }
    }
    return cnt;
  };
  var rep_traceDiagonal = function(rp, i, j, n) {
    var m = n - j, cnt = 0, l = 0, indx;
    for (;l < m; l++, i++, j++) {
      indx = i * n + j;
      if (rp[indx] === 1) {
        cnt++;
        rp[indx] = 2;
      } else {
        break;
      }
    }
    return cnt;
  };
  var rep_distanceToRP = function(d, eps) {
    var n = d.length, rp = stat.uint8Array(n, 0), i = 0;
    for (;i < n; i++) rp[i] = d[i] <= eps ? 1 : 0;
    return rp;
  };
  var rep_rectCollectionArea = function(bc) {
    var s = 0, n = bc.length, i;
    for (i = 0; i < n; i++) s += bc[i].w * bc[i].h;
    return s;
  };
  var rep_isHorzLine = function(rp, s, i, j, h, w) {
    var m = i + h, n = j + w, ii = (m - 1) * s, k;
    if (m > s || n > s) return false;
    for (k = j; k < n; k++) if (rp[ii + k] <= 0) return false;
    return true;
  };
  var rep_isVertLine = function(rp, s, i, j, h, w) {
    var m = i + h, n = j + w, jj = n - 1, k;
    if (m > s || n > s) return false;
    for (k = i; k < m; k++) if (rp[k * s + jj] <= 0) return false;
    return true;
  };
  var rep_isHalfAnnulus = function(rp, s, i, j, h, w) {
    var m = i + h, n = j + w, ii = (m - 1) * s, jj = n - 1, k;
    if (m > s || n > s) return false;
    for (k = i; k < m; k++) if (rp[k * s + jj] <= 0) return false;
    for (k = j; k < n - 1; k++) if (rp[ii + k] <= 0) return false;
    return true;
  };
  var rep_setRPVal = function(rp, s, i, j, h, w, val) {
    var m = i + h, n = j + w, k, l;
    for (k = i; k < m; k++) for (l = j; l < n; l++) rp[k * s + l] = val;
  };
  var rep_isRect = function(rp, s, i, j, h, w) {
    var m = i + h, n = j + w, k, l;
    if (n > s || m > s) return false;
    for (k = i; k < m; k++) for (l = j; l < n; l++) if (rp[k * s + l] <= 0) return false;
    return true;
  };
  var rep_diagonalSquares = function(rp, s, minsize) {
    var w = minsize, h = minsize, squares = [], last = {}, k = 0, i = 0, j = 0, f = false;
    while (i <= s - minsize) {
      if (rep_isRect(rp, s, i, j, h, w)) {
        f = true;
        last.i = i;
        last.j = j;
        last.w = w;
        last.h = h;
        w = w + 1;
        h = w;
      } else {
        if (f) {
          squares.push({
            i: last.i,
            j: last.j,
            h: last.h,
            w: last.w
          });
          rep_setRPVal(rp, s, last.i, last.j, last.h, last.w, 0);
          j = last.j + last.w;
          i = k = j;
          h = w = minsize;
          f = false;
        } else {
          j = i = ++k;
          h = w = minsize;
        }
      }
    }
    if (f) squares.push({
      i: last.i,
      j: last.j,
      h: last.h,
      w: last.w
    });
    return squares;
  };
  var rep_offDiagonalRects = function(rp, s, minw, minh) {
    var match = [ rep_isRect, rep_isHalfAnnulus, rep_isVertLine, rep_isHorzLine ], rects = [], last = {}, lastSquare = {}, wideRect = {}, w = minw, h = minh, f = false, i = 0, j = 0, gdir = 0, found;
    while (s - minh > i) {
      if (match[gdir](rp, s, i, j, h, w)) {
        f = true;
        last.i = i;
        last.j = j;
        last.w = w;
        last.h = h;
        if (gdir === 0 || gdir === 1) {
          w = w + 1;
          h = h + 1;
          gdir = 1;
        } else if (gdir === 2) {
          w = w + 1;
        } else if (gdir === 3) {
          h = h + 1;
        }
      } else {
        if (f) {
          if (gdir === 3) {
            found = last;
            if (wideRect.w && wideRect.h) found = wideRect.w * wideRect.h > last.w * last.h ? wideRect : last;
            rects.push({
              i: found.i,
              j: found.j,
              h: found.h,
              w: found.w
            });
            rep_setRPVal(rp, s, found.i, found.j, found.h, found.w, 0);
            f = false;
            gdir = 0;
            i = found.i;
            j = found.j + found.w;
            if (j > s - minw) {
              j = 0;
              ++i;
            }
            w = minw;
            h = minh;
          } else if (gdir === 1) {
            lastSquare.i = last.i;
            lastSquare.j = last.j;
            lastSquare.h = last.h;
            lastSquare.w = last.w;
            w = lastSquare.w + 1;
            h = lastSquare.h;
            gdir = 2;
          } else if (gdir === 2) {
            wideRect.i = last.i;
            wideRect.j = last.j;
            wideRect.w = last.w;
            wideRect.h = last.h;
            i = lastSquare.i;
            j = lastSquare.j;
            h = lastSquare.h + 1;
            w = lastSquare.w;
            gdir = 3;
          }
        } else {
          ++j;
          if (j > s - minw) {
            j = 0;
            ++i;
          }
          gdir = 0;
          w = minw;
          h = minh;
        }
      }
    }
    if (f) {
      found = wideRect.w * wideRect.h > last.w * last.h ? wideRect : last;
      rects.push({
        i: found.i,
        j: found.j,
        h: found.h,
        w: found.w
      });
    }
    return rects;
  };
  var rep_countRects = function(rp, n, w, h) {
    var minh = h || 5, minw = w || 5;
    return {
      dsq: rep_rectCollectionArea(rep_diagonalSquares(rp, n, minw)),
      odr: rep_rectCollectionArea(rep_offDiagonalRects(rp, n, minw, minh))
    };
  };
  if (typeof define === "function" && define.amd) {
    define(rep);
  } else if (typeof module === "object" && module.exports) {
    module.exports = rep;
  } else {
    this.rep = rep;
  }
}();