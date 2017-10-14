import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Dropdown } from 'semantic-ui-react';
import '../../assets/styles/common/chatsetting.css';
import * as constant from '../constants';

const translate = require('counterpart');
const openStream = require('../../lib/helper/streaming/open_stream');
const playVideo = require('../../lib/helper/streaming/play_video');
const videoCall = require('../../lib/helper/video_call');
const closeMediaStream = require('../../lib/helper/streaming/close_media_stream');
const streamEvent = require('../../lib/helper/streaming/listen_event_from_database');
const fileEvent = require('../../lib/helper/upfile/listen_event_from_database');

const $ = require('jquery');
var imageRef;
var fileRef;
var requestRef;
var cancelRequestRef;
var streamRef;
var callSide;
var answerSide;

var currentUser;
var targetUser;
var currentRoom;
var currentPeer;
class ChatSetting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      current_user_type: '',
      current_room_id: '',
      images_list:[],
      files_list: []
    }
  }
  componentWillMount() {
    currentUser = this.props.currentUser;
    targetUser = this.props.targetChatUser;
    currentRoom = this.props.currentRoomId;
  }
  shouldComponentUpdate(nextProps, nextState){
    if(this.state !== nextState || currentRoom !== nextProps.currentRoomId ||
      currentPeer !== nextProps.currentPeer ||
      (nextProps.currentRoomId && nextProps.currentUser
        && nextProps.targetChatUser)){
      return true;
    }

    return false;
  }
  componentDidMount(){
    $('#current-user-ava').on('click', event =>{
      console.log('123');
    })
  }

  componentWillUpdate(nextProps, nextState){
    var component = this;
    if(currentPeer !== nextProps.currentPeer){
      currentPeer = nextProps.currentPeer;
      currentPeer.on('call', function(called) {
        openStream(stream =>{
          called.answer(stream);
          answerSide = called;
          called.on('stream',remoteStream =>{
            console.log(remoteStream);
            playVideo(remoteStream,'localStream');
          })
          called.on('close', function(){
            closeMediaStream(stream, '#localStream');          
          })
        })
      });
    }
    if(currentRoom !== nextProps.currentRoomId){
      currentRoom = nextProps.currentRoomId;
      var imagesList = [];
      var filesList = [];
      component.setState({
        current_room_id: nextProps.currentRoomId,
        images_list: [],
        files_list: []
      });
      
      if ( typeof imageRef !== 'undefined' && imageRef){
        imageRef.off();
      }
      if ( typeof fileRef !== 'undefined' && fileRef){
        fileRef.off();
      }
      if ( typeof requestRef !== 'undefined' && requestRef){
        requestRef.off();
      }
      if ( typeof cancelRequestRef !== 'undefined' && cancelRequestRef){
        requestRef.off();
      }
      if ( typeof streamRef !== 'undefined' && streamRef){
        streamRef.off();
      }
      let properties = {}
      properties['rid'] = nextProps.currentRoomId;
      properties['uid'] = currentUser.uid;
      properties['peer'] = currentPeer;
      console.log(currentPeer)
      properties['vid'] = '#localStream';

      streamEvent.listenFromStreamFolder(properties,function(call,ref){
        streamRef = ref;
        callSide = call;
      })

      streamEvent.listenFromRequestFolder(properties,function(ref){
        requestRef = ref;
      })

      streamEvent.listenFromCancelRequestFolder(properties, function(ref){
        cancelRequestRef = ref;
      })
      properties['imagesList'] = imagesList;
      properties['filesList'] = filesList;
      properties['component'] = component;

      fileEvent.listenFromImageFolder(properties, function(ref){
        imageRef = ref;
      })

      fileEvent.listenFromFilesFolder(properties,function(ref){
        fileRef = ref;
      })  
    }
    return true;
  }

  endCall(){
    try{        
      callSide.close();
      answerSide.close();    
    }catch(err){

    }
  }

  makeCallRequest(){
    let properties = {};
    properties['rid'] = this.state.current_room_id;
    properties['uid'] = currentUser.uid;
    videoCall.checkRequest(properties, function(issuccess){
      if(issuccess){
        alert('already been used');
      }else{
        videoCall.createRequest(properties,function(issuccess){
          
        });
      }
    });
    
  }  
  renderAva() {
    if(currentUser.uid !== targetUser.uid){
      return(
        <img src={targetUser.photoURL} alt='ava-lawyer'/>
      )
    }else{
      return(
        <div>     
          <img src={targetUser.photoURL} alt='ava-lawyer' id='current-user-ava'/>
        </div>
      )
    }
    
  }
  
  renderVideo(){
    if(currentUser.uid !== targetUser.uid){
      return(
        <div>
          <video className='video' id='localStream' autoPlay></video>
            <button className='button-call' onClick={this.makeCallRequest
        .bind(this)} >Call</button>
            <button className='button-call' onClick={this.endCall.bind(this)} >End</button>
        </div>
      )
    }
  }

  editUserName() {

  }

  editUserAva() {

  }

  logout() {
    
  }

  renderConfig(){
    if (currentUser.uid === targetUser.uid) {
      return(
        <Dropdown icon='settings'>
          <Dropdown.Menu>
            <Dropdown.Item text={translate('app.user.edit.ava')}
              onClick={this.editUserName.bind(this)}/>
            <Dropdown.Item text={translate('app.user.edit.name')}
              onClick={this.editUserAva.bind(this)}/>
            <Dropdown.Item text={translate('app.identifier.logout')}
              onClick={this.logout.bind(this)}/>
          </Dropdown.Menu>
        </Dropdown>
      )
    }
  }

  render() {
    return(
      <div className='chat-setting'>
        <div className='header'>
          <div className='ava'>
            {this.renderAva()}
          </div>
          <div className='info'>
            <div className='user-name'>{targetUser.displayName}</div>
          </div>
          <div className='config'>
            {this.renderConfig()}
          </div> 
        </div>
        <div className='content'>
          <div className='shared shared-files'>
            <div className='content-title'>{translate('app.chat.shared_files')}</div>
            <div className='files-list'>
              {
                this.state.files_list.map(file => {
                  return(
                    <Link to={file.downloadURL}
                      target='_blank'>
                        {file.name}
                    </Link>
                  )
                })
              }
            </div>
          </div>
          <div className='shared shared-images'>
            <div className='content-title'>{translate('app.chat.shared_images')}</div>
            <div className='images-list'>
              {
                this.state.images_list.map(image => {
                  return(
                    <Link to={image.downloadURL}
                      target='_blank'>
                        {image.name}
                    </Link>
                  )
                })
              }
            </div>
          </div>
          {this.renderVideo()}
        </div>
      </div> 
    )
  }
}

export default ChatSetting;