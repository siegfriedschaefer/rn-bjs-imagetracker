/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React, {
  FunctionComponent,
  useEffect,
  useCallback,
  useState,
} from 'react';

import {SafeAreaView, View, Button, ViewProps, StatusBar} from 'react-native';

import {EngineView, useEngine} from '@babylonjs/react-native';
import {SceneLoader} from '@babylonjs/core/Loading/sceneLoader';
import {Camera} from '@babylonjs/core/Cameras/camera';
import {Vector3,
        Axis,
        Space,
        AbstractMesh,
        Mesh,
        HemisphericLight,
        TransformNode,
        FreeCamera} from '@babylonjs/core';
    

import {ArcRotateCamera} from '@babylonjs/core/Cameras/arcRotateCamera';
import '@babylonjs/loaders/glTF';
import {Scene} from '@babylonjs/core/scene';
import { WebXRSessionManager, 
         WebXRTrackingState, 
         WebXRFeatureName, 
         WebXRFeaturesManager,
        } from '@babylonjs/core/XR';

import { WebXRImageTracking } from '@babylonjs/core/XR/features/WebXRImageTracking';

import { stat, DocumentDirectoryPath } from 'react-native-fs';
import { trackerAssets } from '@assets/trackerassets';
import { Dirs, FileSystem } from 'react-native-file-access';
        
const EngineScreen: FunctionComponent<ViewProps> = (props: ViewProps) => {
  const engine = useEngine();
  const [camera, setCamera] = useState<Camera>();
  const [xrSession, setXrSession] = useState<WebXRSessionManager>();
  const [trackingState, setTrackingState] = useState<WebXRTrackingState>();
  const [scene, setScene] = useState<Scene>();
  const [imageTracking, setImageTracking] = useState<WebXRFeaturesManager>();
  const [root, setRoot] = useState<TransformNode>();

  const trackerimg = require('./assets/tracker5x5.png');
  let item: AbstractMesh;

  const onToggleXr = useCallback(() => {
    (async () => {
      if (xrSession) {
        await xrSession.exitXRAsync();
        if (root !== undefined)
          root.setEnabled(false);
      } else {
        if (scene !== undefined) {

          const xr = await scene.createDefaultXRExperienceAsync({
            disableDefaultUI: true,
            disableTeleportation: true,
          });

          const fm = xr.baseExperience.featuresManager;
          const imgTracker = fm.enableFeature(WebXRFeatureName.IMAGE_TRACKING, 'latest', {
            images: [
                {
                  src: 'https://siegfriedschaefer.github.io/rn-babylonjs-pg/assets/tracker5x5.png',
                  estimatedRealWorldWidth: 1.0
                  // uncomment for local ussage
                  // src: 'http://192.168.178.26:8042/assets/tracker5x5.png',
                },
            ]
        }) as WebXRImageTracking;

        imgTracker.onTrackedImageUpdatedObservable.add((image) => {
          if (root !== undefined) {       
            root.setPreTransformMatrix(image.transformationMatrix);  
            root.rotate(Axis.Y, 0.03, Space.LOCAL);

            root.setEnabled(true);
          }
        })

        imgTracker.onUntrackableImageFoundObservable.add((event) => {
          console.log('untrackable' + event);
        })

        imgTracker.onTrackableImageFoundObservable.add((image) => {
          console.log("onTrackableImageFoundObservable");
        })

        const session = await xr.baseExperience.enterXRAsync(
          'immersive-ar',
          'unbounded',
          xr.renderTarget,
        );

        // const availableFeatures = fm.getEnabledFeatures();
        // console.log(availableFeatures);

          setImageTracking(fm);

          setXrSession(session);
          session.onXRSessionEnded.add(() => {
            setXrSession(undefined);
            setTrackingState(undefined);
          });

          setTrackingState(xr.baseExperience.camera.trackingState);
          xr.baseExperience.camera.onTrackingStateChanged.add(
            newTrackingState => {
              setTrackingState(newTrackingState);
            },
          );
        }
      }
    })();
  }, [scene, xrSession]);

  useEffect(() => {
    if (engine) {
      var scene = new Scene(engine);
      scene.createDefaultEnvironment({ createGround: false, createSkybox: false });
      var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
      camera.setTarget(Vector3.Zero());

      // this root node will be transformed by the image tracking module
      const root = new TransformNode("root", scene);
      root.setEnabled(false);
      setRoot(root);
      
      // load the mesh
      const loadmesh = async () => {
 //       const model = await SceneLoader.ImportMeshAsync("", "https://assets.babylonjs.com/meshes/vintageDeskFan/", "vintageFan_animated.gltf", scene);
        const model = await SceneLoader.ImportMeshAsync("", "https://siegfriedschaefer.github.io/rn-babylonjs-pg/assets/", "bauble_blue.glb", scene);
        item = model.meshes[0];
        item.scaling.scaleInPlace(1.0);
        item.rotate(Axis.X, -Math.PI/2.0, Space.LOCAL);
        item.translate(new Vector3(1, 0, 0), 2 );

    
        /*
        // load animations from glTF
        const fanRunning = scene.getAnimationGroupByName("fanRunning");
    
        // Stop all animations to make sure the asset it ready
        scene.stopAllAnimations();
        
        // run the fanRunning animation
        if (fanRunning !== null)
          fanRunning.start(true);
        */
        item.parent = root;
      };

      loadmesh();

      setScene(scene);
      setCamera(scene.activeCamera!);

      /*
      var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
      camera.setTarget(Vector3.Zero());
      let canvas: any = undefined;
      camera.attachControl(canvas, true);
      var light = new HemisphericLight("light1", new Vector3(0, 1, 0), scene);
      light.intensity = 0.7;
      var sphere = Mesh.CreateSphere("sphere1", 16, 2, scene);
      sphere.position.y = 2;
      sphere.position.z = 5;

      setScene(scene);
      setCamera(scene.activeCamera!);
      */
    
    }
  }, [engine]);

  return (
    <>
      <View style={props.style}>
        <Button
          title={xrSession ? 'Stop XR' : 'Start XR'}
          onPress={onToggleXr}
        />
        <View style={{flex: 1}}>
          <EngineView camera={camera} displayFrameRate={true} />
        </View>
      </View>
    </>
  );
};

const App = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{flex: 1, backgroundColor: 'white'}}>
        <EngineScreen style={{flex: 1}} />
      </SafeAreaView>
    </>
  );
};

export default App;
