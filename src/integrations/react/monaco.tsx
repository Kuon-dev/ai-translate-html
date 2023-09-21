/** @jsxImportSource react */
import React from 'react';
import Editor from '@monaco-editor/react';

interface Props {
  name: string;
  defaultValue: string;
  onValueChange: (newContent: string) => void;
}

const MonacoEditor: React.FC<Props> = ({ defaultValue, onValueChange }) => {

  const handleEditorChange = (newValue: any) => {
    onValueChange(newValue);
  };

  return (
    <Editor
      height="80vh"
      language="javascript"
      theme="vs-dark"
      defaultValue={defaultValue}
      onChange={handleEditorChange}
    />
  );
};

export default MonacoEditor;
