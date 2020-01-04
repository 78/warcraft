export default class Pool {
  constructor(className) {
    this.objects = []
    this.className = className
  }

  addTargets(targetList, className) {
    const objs = []
    for(const target of targetList) {
      for(const source of this.objects) {
        const score = source.compareKeypoints(target.keypoints)
        objs.push({score, source, target})
      }
    }
    
    const targetSet = new Set(), sourceSet = new Set()
    objs.sort((a, b) => a.score-b.score)
    for(const pair of objs) {
      if(!targetSet.has(pair.target) && !sourceSet.has(pair.source)) {
        pair.source.moveTo(pair.target)
        targetSet.add(pair.target)
        sourceSet.add(pair.source)
        // check if we have found all the common items
        if(sourceSet.size == this.objects.length || targetSet.size == targetList.length) {
          break
        }
      }
    }
    if(targetList.length > targetSet.size) {
      // add new ones
      for(const target of targetList) {
        if(!targetSet.has(target)) {
          const obj = new this.className(target)
          this.objects.push(obj)
        }
      }
    }else if(this.objects.length > sourceSet.size) {
      // remove
      for(const source of this.objects) {
        if(!sourceSet.has(source)) {
          this.objects.splice(this.objects.indexOf(source), 1)
        }
      }
    }
  }

  update() {
    for(const p of this.objects) {
      p.update()
    }
  }

  render(ctx, startX, startY) {
    for(const p of this.objects) {
      p.render(ctx, startX, startY)
    }
  }

  getOne() {
    if(this.objects.length > 0) {
      return this.objects[0]
    }
    return null
  }
}
