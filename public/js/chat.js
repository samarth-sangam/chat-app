const socket = io()

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button') 
const $sendLocationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageMargin = parseInt(getComputedStyle($newMessage).marginBottom)
    const newMessageHeight =$newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of message container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }

}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username.toUpperCase(),
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        username: message.username.toUpperCase(),
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    users = users.map((user) => {
        user.username = user.username.toUpperCase()
        return user
    })
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$messageFormButton.addEventListener('click', (e) => {
    e.preventDefault()

    if($messageFormInput.value.trim() === '') {
        return
    }

    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')

    socket.emit('message', $messageFormInput.value, (error) => {
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
    })
})

//disable

$sendLocationButton.addEventListener('click', () => {
    $sendLocationButton.setAttribute('disabled','disabled')
    if(!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        //enable: true
        $sendLocationButton.removeAttribute('disabled')
        socket.emit('sendLocation', { 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude 
        }, () => {
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})