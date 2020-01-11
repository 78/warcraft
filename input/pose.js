const PERSON_SCORE_MARGIN = 0.3
const PART_SCORE_MARGIN = 0.2

export default class Pose {
  constructor(pose) {
    this.keypoints = pose.keypoints
    this.score = pose.score
    this.target = null
  }

  render(context, startX=0, startY=0) {
    if(this.score && this.score < PERSON_SCORE_MARGIN) {
        return
    }
    const kps = this.keypoints
    function drawLine(p1, p2, col) {
        if(p1.score < PART_SCORE_MARGIN || p2.score < PART_SCORE_MARGIN)
            return
        context.beginPath()
        context.lineWidth = 40
        context.strokeStyle = col
        context.moveTo(startX+p1.x, startY+p1.y)
        context.lineTo(startX+p2.x, startY+p2.y)
        context.stroke()
    }
    const col = 'rgba(0,0,0,0.5)'
    drawLine(kps.nose, kps.neck, col)
    drawLine(kps.nose, kps.leftEye, col)
    drawLine(kps.nose, kps.rightEye, col)
    drawLine(kps.leftEye, kps.leftEar, col)
    drawLine(kps.rightEye, kps.rightEar, col)
    drawLine(kps.leftShoulder, kps.rightShoulder, col)
    drawLine(kps.leftShoulder, kps.leftElbow, col)
    drawLine(kps.leftElbow, kps.leftWrist, col)
    drawLine(kps.rightShoulder, kps.rightElbow, col)
    drawLine(kps.rightElbow, kps.rightWrist, col)

    drawLine(kps.leftHip, kps.rightHip, col)
    drawLine(kps.leftHip, kps.leftKnee, col)
    drawLine(kps.leftKnee, kps.leftAnkle, col)
    drawLine(kps.rightHip, kps.rightKnee, col)
    drawLine(kps.rightKnee, kps.rightAnkle, col)
    drawLine(kps.midHip, kps.neck, col)

    for(const key in kps) {
        const p = kps[key]
        if(p.score < PART_SCORE_MARGIN)
            continue
        context.fillStyle = 'rgba(0,0,0,0.5)'
        context.beginPath()
        context.arc(startX+p.x, startY+p.y, 20, 0, 2*Math.PI)
        context.fill()
    }
  }

  renderColorful(context, startX=0, startY=0) {
    if(this.score && this.score < PERSON_SCORE_MARGIN) {
        return
    }
    const kps = this.keypoints
    function drawLine(p1, p2, col) {
        if(p1.score < PART_SCORE_MARGIN || p2.score < PART_SCORE_MARGIN)
            return
        context.beginPath()
        context.lineWidth = 3
        context.strokeStyle = col
        context.moveTo(startX+p1.x, startY+p1.y)
        context.lineTo(startX+p2.x, startY+p2.y)
        context.stroke()
    }
    drawLine(kps.nose, kps.neck, '#FF5733')
    drawLine(kps.nose, kps.leftEye, '#FF5733')
    drawLine(kps.nose, kps.rightEye, '#FF5733')
    drawLine(kps.leftEye, kps.leftEar, '#FF5733')
    drawLine(kps.rightEye, kps.rightEar, '#FF5733')
    drawLine(kps.leftShoulder, kps.rightShoulder, '#FFBD33')
    drawLine(kps.leftShoulder, kps.leftElbow, '#DBFF33')
    drawLine(kps.leftElbow, kps.leftWrist, '#75FF33')
    drawLine(kps.rightShoulder, kps.rightElbow, '#FF33B5')
    drawLine(kps.rightElbow, kps.rightWrist, '#FF334F')

    drawLine(kps.leftHip, kps.rightHip, '#E333FF')
    drawLine(kps.leftHip, kps.leftKnee, '#33FF52')
    drawLine(kps.leftKnee, kps.leftAnkle, '#33FFB8')
    drawLine(kps.rightHip, kps.rightKnee, '#FD61FF')
    drawLine(kps.rightKnee, kps.rightAnkle, '#FF61B2')
    drawLine(kps.midHip, kps.neck, '#FFE933')

    for(const key in kps) {
        const p = kps[key]
        if(p.score < PART_SCORE_MARGIN)
            continue
        context.fillStyle = 'rgba(255,255,255,0.7)'
        context.beginPath()
        context.arc(startX+p.x, startY+p.y, 5, 0, 2*Math.PI)
        context.fill()
    }
  }

  moveTo(target) {
    this.target = target
  }

  update() {
    function getMoveDistance(a, b) {
      return (a-b)/5
    }
    if(this.target) {
      for(const key in this.target.keypoints) {
        const a = this.keypoints[key]
        const b = this.target.keypoints[key]
        if(a.score < PART_SCORE_MARGIN) {
          this.keypoints[key] = b
        }else{
          this.keypoints[key] = {
            x: a.x + getMoveDistance(b.x, a.x),
            y: a.y + getMoveDistance(b.y, a.y),
            score: b.score
          }
        }
      }
    }
  }

  compareKeypoints(kps) {
    let n = 0, delta = 0
    for(const key in this.keypoints) {
      if(kps[key]) {
        const a = this.keypoints[key]
        const b = kps[key]
        n += 1
        delta += Math.pow(a.x-b.x, 2) + Math.pow(a.y-b.y, 2)
      }
    }
    return delta / n
  }

  checkPose(type) {
    if(type === 'HandsUp') {
      if(this.keypoints.leftWrist.y < this.keypoints.leftEye.y && this.keypoints.rightWrist.y < this.keypoints.rightEye.y) {
        return true
      }
    }else{
      console.error('Unknown pose type', type)
    }
    return false
  }
}
