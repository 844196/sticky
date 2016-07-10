'use strict'

require('babel-polyfill')
require('jquery')
require('jquery-ui')
require('../bower_components/jquery-ui/themes/base/jquery-ui.min.css')
require('marked')

const SKELETON = $('#skeleton')
const WINDOW = {
  HEIGHT: $(window).height(),
  WIDTH: $(window).width()
}
const NOTE = {
  MINIMUM: {
    HEIGHT: SKELETON.outerHeight(true),
    WIDTH: SKELETON.outerWidth(true)
  },
  MAXIMUM: {
    HEIGHT: WINDOW.HEIGHT,
    WIDTH: WINDOW.WIDTH
  },
  HEADING: {
    HEIGHT: SKELETON.find('.panel-heading').outerHeight(true),
    WIDTH: SKELETON.find('.panel-heading').outerWidth(true)
  }
}

class UUID
{
  static generate()
  {
    let uuid = '', i, random
    for (let i = 0; i < 32; i++) {
      random = Math.random() * 16 | 0

      if (i == 8 || i == 12 || i == 16 || i == 20) {
        uuid += '-'
      }
      uuid += (i == 12 ? 4 : (i == 16 ? (random & 3 | 8) : random)).toString(16)
    }
    return uuid
  }
}

class MarkupOperation
{
  constructor()
  {
    this.renderer = new marked.Renderer()
    this.renderer.heading = (text, level) => {
      if (level === 1) {
        return ''
          + `<h${level}>`
            + text
            + '<div class="modified_at">'
              + '<i class="fa fa-clock-o fa-fw"></i>&nbsp;'
              + `Updated at ${new Date().toLocaleString()}`
            + '</div>'
          + `</h${level}>`;
      } else {
        return `<h${level}>${text}</h${level}>`
      }
    }
    this.renderer.listitem = (text) => {
      if (text.match(/^\[[ x]\]\s*/)) {
        let rtn = text
          .replace(/^\[ \]\s*/, '<i class="fa fa-square-o fa-fw"></i>&nbsp;')
          .replace(/^\[x\]\s*/, '<i class="fa fa-check-square-o fa-fw"></i>&nbsp;')
        return '<li style="list-style:none">' + rtn + '</li>'
      } else {
        return '<li>' + text + '</li>'
      }
    }
  }

  invoke(content)
  {
    return marked(content, {renderer: this.renderer})
  }
}

class StickyNote
{
  constructor()
  {
    this.uuid = UUID.generate()
    this.instance = SKELETON.clone().attr('id', this.uuid)

    this.instance.resizable({
      minHeight: NOTE.MINIMUM.HEIGHT,
      minWidth: NOTE.MINIMUM.WIDTH
    })
    this.instance.draggable({
      stack: 'div',
      handle: '.panel-heading'
    })
    this.instance.css({
      'max-height': NOTE.MAXIMUM.HEIGHT,
      'max-width': NOTE.MAXIMUM.WIDTH
    })
    this.instance.find('.panel-body').height(NOTE.MINIMUM.HEIGHT - NOTE.HEADING.HEIGHT)
  }

  get title()
  {
    return this._title
  }

  set title(string)
  {
    this._title = string
    this.instance.find('.panel-title > .h5').text(string)
  }

  get content()
  {
    return this._content
  }

  set content(string)
  {
    this._content = string
    this.instance.find('.editor').text(string)
    this.instance.find('.rendered-markdown').html(new MarkupOperation().invoke(string))
  }

  get size()
  {
    return {
      height: this.instance.css('height'),
      width: this.instance.css('width')
    }
  }

  set size(hash)
  {
    this.instance.css({
      'height': hash.height,
      'width': hash.width
    })
    this.instance.find('.panel-body').height(parseInt(hash.height, 10) - NOTE.HEADING.HEIGHT - 2)
  }

  get position()
  {
    return {
      x: this.instance.css('left'),
      y: this.instance.css('top'),
      z: this.instance.css('z-index')
    }
  }

  set position(hash)
  {
    this.instance.css({
      'left': hash.x,
      'top': hash.y,
      'z-index': hash.z
    })
  }

  editStart()
  {
    this.instance.find('.note-edit').addClass('on-edit')
    this.instance.find('.rendered-markdown').css('display', 'none')
    this.instance.find('.editor').css('display', 'block').focus()
  }

  editEnd()
  {
    let content = this.instance.find('.editor').val()
    this.content = content
    this.instance.find('.note-edit').removeClass('on-edit')
    this.instance.find('.rendered-markdown').css('display', 'block')
    this.instance.find('.editor').css('display', 'none')
  }

  remove()
  {
    this.instance.remove()
  }
}

class WhiteBoard
{
  constructor()
  {
    this.instance = $('main')
    this.notes = {}

    let self = this
    $(window).keydown((e) => {
      if ($(':focus').length === 0 && e.shiftKey && e.keyCode === 78) {
        let note = self.addNote()
        note.editStart()
        this.save()
        return false
      }
    })

    $('header').on('contextmenu', (e) => {
      let note = this.addNote()
      note.position = {
        x: (e.clientX - NOTE.MINIMUM.WIDTH / 2),
        y: (e.clientY - NOTE.HEADING.HEIGHT / 2)
      }
      note.editStart()
      this.save()
      return false
    })

    $('#remove_all').on('click', () => {
      this.removeAll()
      this.save()
    })

    $('#tidy_up').on('click', () => {
      this.tidyUp()
      this.save()
    })

    this.load()
  }

  addNote(
    title = new Date().toLocaleString(),
    content = '',
    size = {height: NOTE.MINIMUM.HEIGHT, width: NOTE.MINIMUM.WIDTH},
    position = {x: (NOTE.MAXIMUM.WIDTH / 2 - NOTE.MINIMUM.WIDTH / 2), y: (NOTE.MAXIMUM.HEIGHT / 2 - NOTE.MINIMUM.HEIGHT / 2), z: (this.topFrontElementIndex() + 1)}
  ) {
    let note = new StickyNote()
    note.title = title
    note.content = content
    note.size = size
    note.position = position
    note.instance.appendTo(this.instance)

    note.instance.find('.note-edit').on('click', () => {
      if (note.instance.find('.editor').css('display') === 'none') {
        note.editStart()
        this.save()
      } else {
        note.editEnd()
        this.save()
      }
    })

    note.instance.find('.note-close').on('click', () => {
      this.remove(note)
      this.save()
    })

    note.instance.on('click', () => {
      note.instance.css('z-index', this.topFrontElementIndex() + 1)
      this.save()
    })

    note.instance.on('resize', (e, ui) => {
      note.instance.find('.panel-body').height(ui.size.height - NOTE.HEADING.HEIGHT - 6)
      this.save()
    })

    note.instance.on('dragstop resizestop', () => {
      this.save()
    })

    this.notes[note.uuid] = note
    this.save()

    return note
  }

  save()
  {
    let notes = Object.values(this.notes).map(note => {
      return {
        title: note.title,
        content: note.content,
        position: note.position,
        size: note.size
      }
    })
    localStorage.sticky = JSON.stringify(notes)
  }

  load()
  {
    if (localStorage.sticky) {
      $.each(JSON.parse(localStorage.sticky), (_, note) => {
        this.addNote(note.title, note.content, note.size, note.position)
      })
    }
  }

  remove(note)
  {
    note.remove()
    delete this.notes[note.uuid]
  }

  removeAll()
  {
    $.each(this.notes, (_, note) => {
      this.remove(note)
    })
  }

  tidyUp()
  {
    $.each(Object.values(this.notes), (index, note) => {
      let margin = (index + 1) * NOTE.HEADING.HEIGHT
      note.position = {
        x: margin,
        y: margin,
        z: index
      }
    })
  }

  topFrontElementIndex()
  {
    let indexes = Object.values(this.notes).map(note => note.position.z)
    return Math.max.apply(null, indexes)
  }
}

new WhiteBoard()
