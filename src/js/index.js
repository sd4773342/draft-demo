import React from 'react';
import ReactDOM from 'react-dom';
import {
  convertToRaw,
  CompositeDecorator,
  ContentState,
  Editor,
  EditorState,
  Entity,
  RichUtils
} from 'draft-js';
import Immutable from 'immutable';
import "draft-js/dist/Draft.css";
import styles from "../css/Rich.less";

function findLinkEntities(contentBlock, callback) {
  contentBlock.findEntityRanges((character) => {
    const entityKey = character.getEntity();
    return (entityKey !== null && Entity.get(entityKey).getType() === 'LINK');
  }, callback);
}

const Link = (props) => {
  const {url} = Entity.get(props.entityKey).getData();
  return (
    <a href={url} style={styles2.link}>
      {props.children}
    </a>
  );
};

const styles2 = {
  root: {
    fontFamily: '\'Georgia\', serif',
    padding: 20,
    width: 600
  },
  buttons: {
    marginBottom: 10
  },
  urlInputContainer: {
    marginBottom: 10
  },
  urlInput: {
    fontFamily: '\'Georgia\', serif',
    marginRight: 10,
    padding: 3
  },
  editor: {
    border: '1px solid #ccc',
    cursor: 'text',
    minHeight: 80,
    padding: 10
  },
  button: {
    marginTop: 10,
    textAlign: 'center'
  },
  link: {
    color: '#3b5998',
    textDecoration: 'underline'
  }
};

class MyEditor extends React.Component {
  constructor(props) {
    super(props);

    const decorator = new CompositeDecorator([
      {
        strategy: findLinkEntities,
        component: Link
      }
    ]);

    this.state = {
      editorState: EditorState.createEmpty(decorator),
      showURLInput: false,
      urlValue: ''
    };
    this.focus = () => this.refs.editor.focus();
    this.onChange = (editorState) => this.setState({editorState});
    this.logState = () => {
      const content = this.state.editorState.getCurrentContent();
      console.log(convertToRaw(content));
    };
    this.promptForLink = this._promptForLink.bind(this);
    this.onURLChange = (e) => this.setState({urlValue: e.target.value});
    this.confirmLink = this._confirmLink.bind(this);
    this.onLinkInputKeyDown = this._onLinkInputKeyDown.bind(this);
    this.removeLink = this._removeLink.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.onTab = (e) => this._onTab(e);
    this.toggleBlockType = (type) => this._toggleBlockType(type);
    this.toggleInlineStyle = (style) => this._toggleInlineStyle(style);
  };

  handleKeyCommand(command) {
    const newState = RichUtils.handleKeyCommand(this.state.editorState, command);
    if (newState) {
      this.onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  }

  _onTab(e) {
    const maxDepth = 4;
    this.onChange(RichUtils.onTab(e, this.state.editorState, maxDepth));
  }

  _onBoldClick() {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, 'BOLD'));
  }

  _toggleBlockType(blockType) {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  }

  _toggleInlineStyle(inlineStyle) {
    this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle));
  }

  _promptForLink(e) {
    e.preventDefault();
    const {editorState} = this.state;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      this.setState({
        showURLInput: true,
        urlValue: ''
      }, () => {
        setTimeout(() => this.refs.url.focus(), 0);
      });
    }
  }
  _confirmLink(e) {
    e.preventDefault();
    const {editorState, urlValue} = this.state;
    const entityKey = Entity.create('LINK', 'MUTABLE', {url: urlValue});
    this.setState({
      editorState: RichUtils.toggleLink(editorState, editorState.getSelection(), entityKey),
      showURLInput: false,
      urlValue: ''
    }, () => {
      setTimeout(() => this.refs.editor.focus(), 0);
    });
  }

  _onLinkInputKeyDown(e) {
    if (e.which === 13) {
      this._confirmLink(e);
    }
  }

  _removeLink(e) {
    e.preventDefault();
    const {editorState} = this.state;
    const selection = editorState.getSelection();
    if (!selection.isCollapsed()) {
      this.setState({
        editorState: RichUtils.toggleLink(editorState, selection, null)
      });
    }
  }

  render() {

    const {editorState} = this.state;
    let urlInput;
    if (this.state.showURLInput) {
      urlInput = <div style={styles2.urlInputContainer}>
        <input onChange={this.onURLChange} ref="url" style={styles2.urlInput} type="text" value={this.state.urlValue} onKeyDown={this.onLinkInputKeyDown}/>
        <button onMouseDown={this.confirmLink}>
          确定
        </button>
      </div>;
    }
    let className = styles['RichEditor-editor'];
    var contentState = editorState.getCurrentContent();

    if (!contentState.hasText()) {
      if (contentState.getBlockMap().first().getType() !== 'unstyled') {
        className += ' ' + styles['RichEditor-hidePlaceholder'];
      }
    }

    return (
      <div>
        <div style={{
          marginBottom: 10
        }}></div>
        <div style={styles2.buttons}>
          <button onMouseDown={this.promptForLink} style={{
            marginRight: 10
          }}>
            添加链接
          </button>
          <button onMouseDown={this.removeLink}>
            去除链接
          </button>
        </div>
        {urlInput}
        <div className={styles["RichEditor-root"]}>
          <BlockStyleControls editorState={editorState} onToggle={this.toggleBlockType}/>
          <InlineStyleControls editorState={editorState} onToggle={this.toggleInlineStyle}/>
          <div className={className} onClick={this.focus}>
            <Editor blockStyleFn={getBlockStyle} customStyleMap={styleMap} editorState={editorState} handleKeyCommand={this.handleKeyCommand} onChange={this.onChange} onTab={this.onTab} placeholder="Tell a story..." ref="editor" onFocus={() => {
              console.log('focus')
            }} ref='editor' spellCheck={true}/>
          </div>
        </div>
        <input onClick={this.logState} style={styles2.button} type="button" value="提交内容"/>
      </div>
    );
  }
}

const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2
  }
};

function getBlockStyle(block) {
  switch (block.getType()) {
    case 'blockquote':
      return styles['RichEditor-blockquote'];
    default:
      return null;
  }
}

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = (e) => {
      e.preventDefault();
      //debugger
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let className = styles['RichEditor-styleButton'];
    if (this.props.active) {
      className += ' ' + styles['RichEditor-activeButton'];
    }

    return (
      <span className={className} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

const BLOCK_TYPES = [
  {
    label: 'H1',
    style: 'header-one'
  }, {
    label: 'H2',
    style: 'header-two'
  }, {
    label: 'H3',
    style: 'header-three'
  }, {
    label: 'H4',
    style: 'header-four'
  }, {
    label: 'H5',
    style: 'header-five'
  }, {
    label: 'H6',
    style: 'header-six'
  }, {
    label: 'Blockquote',
    style: 'blockquote'
  }, {
    label: 'UL',
    style: 'unordered-list-item'
  }, {
    label: 'OL',
    style: 'ordered-list-item'
  }, {
    label: 'Code Block',
    style: 'code-block'
  }
];

const BlockStyleControls = (props) => {
  const {editorState} = props;
  const selection = editorState.getSelection();
  const blockType = editorState.getCurrentContent().getBlockForKey(selection.getStartKey()).getType();

  return (
    <div className={styles["RichEditor-controls"]}>
      {BLOCK_TYPES.map((type) => <StyleButton key={type.label} active={type.style === blockType} label={type.label} onToggle={props.onToggle} style={type.style}/>)}
    </div>
  );
};

var INLINE_STYLES = [
  {
    label: 'Bold',
    style: 'BOLD'
  }, {
    label: 'Italic',
    style: 'ITALIC'
  }, {
    label: 'Underline',
    style: 'UNDERLINE'
  }, {
    label: 'Monospace',
    style: 'CODE'
  }
];

const InlineStyleControls = (props) => {
  var currentStyle = props.editorState.getCurrentInlineStyle();
  return (
    <div className={styles["RichEditor-controls"]}>
      {INLINE_STYLES.map(type => <StyleButton key={type.label} active={currentStyle.has(type.style)} label={type.label} onToggle={props.onToggle} style={type.style}/>)}
    </div>
  );
};

MyEditor.propTypes = {};

ReactDOM.render(
  <MyEditor/>, document.getElementById('mainContainer'));
