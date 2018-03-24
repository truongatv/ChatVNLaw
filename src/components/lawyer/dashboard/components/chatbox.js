import React, {Component} from 'react';
import ChatBubble from 'react-chat-bubble';
import $ from 'jquery';
import {Picker} from 'emoji-mart';
import firebase from 'firebase';
import { Scrollbars } from 'react-custom-scrollbars';

import VideoCall from './videocall';

import * as Messages from '../../../../lib/messages/messages';
import * as translate from 'counterpart';

class ChatBox extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      currentRoomId: null,
      currentUser: null,
      targetUser: null,
      chatMessHeight: 0,
      emojiVisibility: false,
      sign: null
    };
  }  
  
  componentWillMount(){
    var component = this;
    this.setState({currentUser: this.props.currentUser,
      targetUser: this.props.targetUser});
    this.props.emitter.addListener('ReSendData',function(callback){
      return callback(component.state.currentUser,
        component.state.targetUser, component.state.currentRoomId);
    });
    this.props.emitter.addListener('AddNewTag', function(mess){
      component.updateTag(mess);
    })
    this.props.emitter.addListener('RemoveTag', function(mess){
      component.updateTag(mess);
    })
  }

  setHeight(component, textBoxHeight) {
    var vh = Math.max(document.documentElement.clientHeight,
      window.innerHeight || 0);
    var chatMessHeight = vh - 45.5 - textBoxHeight
      - $('.app-header').height();
    component.setState({chatMessHeight: chatMessHeight});
  }

  componentDidMount() {
    var component = this;
    $(document).mouseup(function(e) {
      var container = $('.emoji-section');
      var emojiPicker = $('#emoji-picker');
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        emojiPicker.css('visibility', 'hidden');
      }
    });
    if(!!window.chrome && !!window.chrome.webstore) {
      this.setHeight(this, 80.5);
    }
    else {
      this.setHeight(this, 60.5);
    }
    $(window).resize(function() {
      component.setHeight(component, $('#text-box').height());
    });
    $('.chat-box').mouseup(function(e) {
      var container = $('.menu-box');
      var tagsBox = $('.ReactTags__tags');
      if (!container.is(e.target) && container.has(e.target).length === 0) {
        if($('.tools:visible').length > 0){
          $('.tools:visible').css('display', 'none');
          tagsBox.css('display', 'none');
        }
      }
    });
  }
  
  componentWillReceiveProps(nextProps){
    var component = this;
    if(this.state.targetUser !== nextProps.targetUser && !!nextProps.targetUser){
      this.setState({targetUser: nextProps.targetUser,
        currentRoomId: nextProps.targetUser.rid});
      if(!!this.state.targetUser){
        if(this.state.targetUser.rid !== nextProps.targetUser.rid){
          this.setState({messages: []})
        }
      }
    }
    if(this.state.currentUser !== nextProps.currentUser && !!nextProps.currentUser){
      this.setState({currentUser: nextProps.currentUser});
    }
  }

  componentWillUpdate(nextProps, nextState){
    var component = this;
    if(this.state.currentRoomId !== nextState.currentRoomId){
      component.props.emitter.emit('RoomChatHasChanged',
        nextProps.currentUser, nextProps.targetUser,
        nextState.currentRoomId);         
      let properties = {}
      properties['roomId'] = nextState.currentRoomId;
      properties['component'] = component;
      properties['ts'] = '' + (new Date()).getTime();
      properties['limit'] = 15;
      
      Messages.closeStreamRef();
      Messages.history(properties, function(){
        component.refs.scrollbars.scrollToBottom();        
      });
      Messages.streamingMessage(properties,function(){
        component.refs.scrollbars.scrollToBottom();        
      })
      
    }
  }

  onClickEmoji(emoji,event){
    var inputTextArea = $('#input-mess-box');
    inputTextArea.val(inputTextArea.val() + ' ' + emoji.colons + ' ');
  }

  updateTag(mess){
    let properties = {}
    properties.component = this;
    properties.mess = mess;
    Messages.updateTag(properties);
  }

  handleInputChange(evt) {
    let textBox = $('#input-mess-box');
    if (evt.which === 13 && evt.shiftKey === false) {
      if(textBox.val().length > 0){
        this.handleSubmit();
        evt.preventDefault();
      }
      this.clearContent('input-mess-box');
    }
    else {
      this.autoExpand('input-mess-box');
      this.refs.scrollbars.scrollToBottom();
    }
  } 

  handleScroll(event) {
    if(this.refs.scrollbars.getScrollTop() == 0) {
      let properties = {};
      if(this.state.messages[0]){
        properties['roomId'] = this.state.currentRoomId;
        properties['component'] = this;
        properties['limit'] = 15;
        properties['ts'] = ""+(parseInt(this.state.messages[0].msgTimeStamp) - 1);          
        Messages.history(properties, function(){
        });
      }
    }
  }

  autoExpand(elementId) {
    var input = document.getElementById(elementId);
    var chats = document.getElementsByClassName('chats')[0];
    var vh = Math.max(document.documentElement.clientHeight,
      window.innerHeight || 0);

    input.style.height = '60px';
    var contentHeight = document.getElementById(elementId).scrollHeight;
    input.style.height = contentHeight - 8 + 'px';

    var textbox = document.getElementById('text-box');
    textbox.style.height = contentHeight - 5 + 'px';
    this.setState({chatMessHeight: vh - 101 - contentHeight});
  }

  clearContent(elementId) {
    $('#' + elementId).val($('#' + elementId).val().replace(/\t/g, 'a'));
    $('#' + elementId).val('');
    this.autoExpand(elementId);
    this.refs.scrollbars.scrollToBottom(); 
  }

  handleSubmit(){
    if(!this.state.currentRoomId){
      return;
    }
    var component = this;
    let properties = {};
    var textSubmit = $('#input-mess-box').val();
    if (textSubmit.replace(/\s/g, '').length !== 0) {
      properties['content'] = textSubmit; 
      properties['component'] = component;
      Messages.chat(properties);
    }
  }

  upfile() {
    $('#upfile:hidden').trigger('click');
  }

  renderEmojiPicker(e){
    if(this.state.emojiVisibility) {
      $('#emoji-picker').css('visibility', 'hidden');
    }
    else {
      $('#emoji-picker').css('visibility', 'visible');
    }
    this.setState({emojiVisibility: !this.state.emojiVisibility});
  }

  renderVideo() {
    $('.video-call').show();
    if($('.video-call').find('.video').css('display') == 'none') {
      $('.video-call').find('.video').show();
      $('.video-call').find('.end-call-btn').show();
    }
  }

  render() {
    if(this.state.currentRoomId){
      return(
        <div className='chat-box-wrapper'>
          <VideoCall currentRoomId={this.state.currentRoomId}
            currentUser={this.state.currentUser}
            targetUser={this.state.targetUser}
            emitter={this.props.emitter} />
          <div className='chat-box'>
            <Scrollbars style={{
              height: this.state.chatMessHeight}}
              autoHide={true}
              ref='scrollbars'
              autoHideTimeout={1500}
              onScroll={this.handleScroll.bind(this)}
              renderView={
                props =>
                <div {...props} className='custom-content'/>}>
              <ChatBubble messages={this.state.messages} 
                emitter={this.props.emitter}
                renderHastag={true}
                currentUser={this.state.currentUser}
                targetUser={this.state.targetUser}/>
            </Scrollbars>
            <div className='input-section text-box' id='text-box'>  
              <textarea id='input-mess-box'
                placeholder={translate('app.chat.input_place_holder')}
                onKeyDown={this.handleInputChange.bind(this)} />
              <input type='file' id='upfile'/>
              <div className='addons-field'>
                <div className='emoji-section'>
                  <div id='emoji-picker'>
                    <Picker
                      onClick={this.onClickEmoji}
                      emojiSize={24} 
                      perLine={9}    
                      skin={1}       
                      set='messenger'                
                      showPreview={false}
                      autoFocus={true}
                    />
                  </div>
                </div>
                <i className='fa fa-file-image-o'
                  aria-hidden='true'
                  onClick={this.upfile}></i>
                <i className='fa fa-smile-o'
                  aria-hidden='true'
                  onClick={this.renderEmojiPicker.bind(this)}></i>
              </div>
            </div>
          </div>
        </div>
      )
    }
    else{
      return(
        <div className='chat-box'>
        </div>
      )
    }
  }
}

export default ChatBox;
